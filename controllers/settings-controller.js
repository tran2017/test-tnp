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
const parsePhoneNumber = require("libphonenumber-js/max");
const lookup = require("country-code-lookup");
var { MailListener } = require("mail-listener5");
const legit = require("legit");
const esc = require("email-syntax-check");
const { geocoder, carrier } = require("libphonenumber-geo-carrier");

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

const encryptLetter = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid letter", 422));
  }

  const { words } = req.body;
  try {
    const arrayLetters = ENGINE.processTextToArray(words);

    const letterLibs = ENGINE.encryptedLetterLibrary;
    let convertedList = [];

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
    return next(new HttpError("Invalid letter: " + error, 422));
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

  try {
    const letterLibs = ENGINE.encryptedLetterLibrary;
    const sensitiveWordLibs = ENGINE.sensitiveWordsLib;
    let convertedList = [];

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
    return next(new HttpError("Invalid letter: " + error, 422));
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

  const { numbers } = req.body;
  const numberArr = [];
  for (let index = 0; index < numbers.length; index++) {
    let number = numbers[index];
    if (!number.includes("+")) {
      number = "+" + numbers[index];
    }

    let phoneData;
    try {
      const phoneNumber = parsePhoneNumber(number);
      const type = phoneNumber.getType();
      const location = await geocoder(phoneNumber);
      const carrierName = await carrier(phoneNumber);
      const countryData = lookup.byIso(phoneNumber.country);

      phoneData = {
        country: phoneNumber.country,
        diallingCode: phoneNumber.countryCallingCode,
        type: type,
        local: phoneNumber.formatNational(),
        international: phoneNumber.formatInternational(),
        carrier: carrierName,
        continent: countryData.continent,
        region: countryData.region,
        country: countryData.country,
        city: location,
        capital: countryData.capital,
        isValid: true,
      };
      numberArr.push(phoneData);
    } catch (error) {
      phoneData = {
        isValid: false,
        local: numbers[index],
      };
      numberArr.push(phoneData);
      continue;
    }
  }

  try {
    res.status(202).json({ phoneDatas: numberArr });
  } catch (error) {}
};

const checkIpsBlacklist = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid proxy list", 422));
  }

  const { ips } = req.body;
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
      var mailListener = new MailListener({
        username: user,
        password: pass,
        host: host || "outlook.office365.com",
        port: 993, // imap port
        tls: true,
        connTimeout: 10000, // Default by node-imap
        authTimeout: 5000, // Default by node-imap,
        debug: console.log, // Or your custom function with only one incoming argument. Default: null
        autotls: "never", // default by node-imap
        tlsOptions: { rejectUnauthorized: false },
        mailbox: box, // mailbox to monitor
        searchFilter: ["ALL"], // the search filter being used after an IDLE notification has been retrieved
        markSeen: true, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
        attachments: true, // download attachments as they are encountered to the project directory
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
        const r = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const from = mail.from.text.match(r)[0];
        const to = mail.to.text.match(r);

        resArr.push(from, ...to);
        count++;
        if (count === totalMails) {
          mailListener.stop();
          resolve(resArr);
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

  const { mails, delimiter } = req.body;
  let results = [];
  let validOfficeAccounts = [];
  for (let index = 0; index < mails.length; index++) {
    const mailInfoArr = mails[index].split(delimiter);
    if (mailInfoArr.length < 2) continue;

    const user = mailInfoArr[0];
    const pass = mailInfoArr[1];
    try {
      const promiseArr = await handlerMailBox(user, pass, "outlook.office365.com", "INBOX");
      const promiseArr1 = await handlerMailBox(user, pass, "outlook.office365.com", "JUNK");
      let response;
      let response1;

      response = await Promise.resolve(promiseArr);
      response1 = await Promise.resolve(promiseArr1);
      results.push(...response, ...response1);

      results = results.filter(function (item, pos) {
        return results.indexOf(item) === pos;
      });

      validOfficeAccounts.push(mails[index]);
    } catch (error) {
      continue;
      // return next(new HttpError("Not valid office leads", 422));
    }
  }
  res.status(202).json({ mailList: results, validAccounts: validOfficeAccounts });
};

const RemoveSpamMails = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid mail list", 422));
  }

  const { mails } = req.body;
  let validLeads = [];
  let disposableArr = [];
  let noreplyArr = [];
  let spamTrapArr = [];
  let invalidArr = [];

  for (let index = 0; index < mails.length; index++) {
    try {
      const email = mails[index].trim();
      const legitMail = await legit(email);

      if (!legitMail.isValid) {
        invalidArr.push(email);
        continue;
      }
      const response = await esc.syntaxCheck(email);
      switch (response.status) {
        case ENGINE.DEAD_MAIL_STATUS.DISPOSABLE:
          disposableArr.push(email);
          break;
        case ENGINE.DEAD_MAIL_STATUS.FREE_MAIL:
          validLeads.push(email);
          break;
        case ENGINE.DEAD_MAIL_STATUS.INVALID:
          if (legitMail.isValid) {
            validLeads.push(email);
          } else {
            invalidArr.push(email);
          }
          break;
        case ENGINE.DEAD_MAIL_STATUS.OFFICIAL:
          validLeads.push(email);
          break;
        case ENGINE.DEAD_MAIL_STATUS.ROLES:
          noreplyArr.push(email);
          break;
        case ENGINE.DEAD_MAIL_STATUS.SPAM_TRAP:
          spamTrapArr.push(email);
          break;
        default:
          break;
      }
    } catch (error) {
      continue;
    }
  }

  res.status(202).json({ validMails: validLeads, invalids: { noReply: noreplyArr, spam: spamTrapArr, invalid: invalidArr, disposable: disposableArr } });
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
