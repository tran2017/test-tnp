const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const { getItemsByPageNum, summaryData, commonValues } = require("../shared/engine");
const other = require("../models/other");
const generalSettings = require("../models/general-setting");

let convertedOthers;
const groupByProperty = (xs, key) => {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const summaryOthersByDuration = async () => {
  try {
    const allOthers = await other.find().exec();
    convertedOthers = allOthers.map((x) => x.toObject({ getters: true }));

    const summary = summaryData(convertedOthers);
    return summary;
  } catch (error) {
    return new HttpError("Summary results data failed", 500);
  }
};

const getOthersSummary = async () => {
  try {
    // const allOthers = await other.find().exec();
    // convertedOthers = allOthers.map((x) => x.toObject({ getters: true }));

    let intro = [{ name: "Total results: ", value: convertedOthers.length }];
    let groupBy = groupByProperty(convertedOthers, "type");

    for (var key in groupBy) {
      if (groupBy.hasOwnProperty(key)) {
        const item = { name: `Total ${key}: `, value: groupBy[key].length };
        intro.push(item);
      }
    }

    return intro;
  } catch (error) {
    return new HttpError("Get results summary failed", 500);
  }
};

const getOthersPagination = async (currentPage) => {
  let paginationData;
  try {
    // const convertedOthers = await other.find().exec();
    const sortedByDate = convertedOthers.sort((a, b) => Date.parse(b.added) - Date.parse(a.added));

    const ItemsByPageNum = getItemsByPageNum(sortedByDate, commonValues.perPage, currentPage);
    // const ItemsByPageNum = tempItemsByPageNum.map((x) => x.toObject({ getters: true }));
    const totalPage = Math.ceil(convertedOthers.length / +commonValues.perPage);

    paginationData = {
      currentPage: currentPage,
      itemResults: ItemsByPageNum,
      totalPage: totalPage,
      totalItems: convertedOthers.length,
    };

    return paginationData;
  } catch (error) {
    return new HttpError("Get results data failed", 500);
  }
};

const getOthersSummaryData = async (req, res, next) => {
  const currentPage = 1;
  try {
    const othersByDuration = await summaryOthersByDuration();
    const intro = await getOthersSummary();
    const paginationData = await getOthersPagination(currentPage);
    const allData = convertedOthers;

    const data = { paginationData, intro, othersByDuration, allData };
    res.status(200).json(data);
  } catch (error) {
    return next(new HttpError(`Loading data failed`, 500));
  }
};

const getDataByPageNumber = async (req, res, next) => {
  const { currentPage } = req.params;
  let paginationData;
  try {
    paginationData = await getOthersPagination(currentPage);
    res.status(200).json(paginationData);
  } catch (error) {
    return next(new HttpError(`Loading results failed`, 500));
  }
};

const getOthersByKeyWord = async (req, res, next) => {
  const { keyword, currentPage } = req.params;
  if (keyword.trim() === "") {
    return next(new HttpError(`Please enter a valid keyword`, 422));
  }

  let paginationData;
  try {
    let allOthers = await other.find().exec();
    const othersConverted = allOthers.map((x) => x.toObject({ getters: true }));

    const othersByKeyword = othersConverted.filter((x) => x.item?.includes(keyword) || x.type?.includes(keyword));

    if (othersByKeyword.length === 0) {
      return next(new HttpError(`Not found item data matched key word '${keyword}'`, 404));
    }
    const sortedByDate = othersByKeyword.sort((a, b) => Date.parse(b.added) - Date.parse(a.added));
    const ItemsByPageNum = getItemsByPageNum(sortedByDate, commonValues.perPage, currentPage);
    // const ItemsByPageNum = tempItemsByPageNum.map((x) => x.toObject({ getters: true }));
    const totalPage = Math.ceil(sortedByDate.length / +commonValues.perPage);

    paginationData = {
      currentPage: currentPage,
      itemResults: ItemsByPageNum,
      totalPage: totalPage,
      totalItems: othersByKeyword.length,
    };
  } catch (error) {
    return next(new HttpError(`Unknown error occurred '${keyword}'`, 500));
  }

  res.status(200).json({ paginationData });
};

const getOtherById = async (req, res, next) => {
  const { otherId } = req.params;

  let selectedOther;
  try {
    selectedOther = await other.findById(otherId).exec();
  } catch (error) {
    return next(new HttpError("Get item data failed", 500));
  }

  res.status(200).json({ selectedOther: selectedOther.toObject({ getters: true }) });
};

const createNewOthers = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Item Data.", 422));
  }

  const { item, type } = req.body;
  let timeZone;
  try {
    const settings = await generalSettings.find().exec();
    timeZone = settings[0]?.timezone;
  } catch (error) {
    return next(new HttpError("Adding new fullz failed. Please try again", 500));
  }

  const newOthers = new other({
    item: item,
    type: type,
    // added: new Date(Date.now()).toLocaleString("en-US", { timeZone: timeZone }) || new Date(Date.now()).toLocaleString(),
    added: randomDate(new Date(2022, 0, 1), new Date(), 0, 24).toLocaleString(),
  });

  try {
    await newOthers.save();
  } catch (error) {
    return next(new HttpError("Adding new item failed. Please try again", 500));
  }

  res.status(201).json({ newOthers });
};

function randomDate(start, end, startHour, endHour) {
  var date = new Date(+start + Math.random() * (end - start));
  var hour = (startHour + Math.random() * (endHour - startHour)) | 0;
  date.setHours(hour);
  return date;
}

const deleteOthers = async (req, res, next) => {
  const { otherId } = req.params;

  try {
    otherSelected = await other.findByIdAndRemove(otherId.trim()).exec();
    res.status(202).json({ message: "delete sucessfully" });
  } catch (error) {
    return next(new HttpError("Delete failed. Please try again", 500));
  }
};

const downloadOthers = async (req, res, next) => {
  const { fromDate, toDate, type } = req.params;

  let fDate = !!Date.parse(fromDate);
  let tDate = !!Date.parse(toDate);

  try {
    const allOthers = await other.find().exec();
    const convertedOthers = allOthers.map((x) => x.toObject({ getters: true }));
    let sortedOthers = convertedOthers;

    if (fDate && tDate) {
      fDate = Date.parse(fromDate);
      tDate = Date.parse(toDate);
      sortedOthers = convertedOthers.filter((x) => fDate <= Date.parse(x.added) && Date.parse(x.added) <= tDate);
    }

    if (type !== "undefined") {
      sortedOthers = sortedOthers.filter((x) => x.type?.includes(type));
    }

    res.status(200).json(sortedOthers);
  } catch (error) {
    console.log(error.message);
    return next(new HttpError("Download results data failed", 500));
  }
};

exports.getDataByPageNumber = getDataByPageNumber;
exports.getOthersSummaryData = getOthersSummaryData;

exports.getItemByKeyword = getOthersByKeyWord;
exports.getItemById = getOtherById;

exports.create = createNewOthers;
exports.delete = deleteOthers;
exports.download = downloadOthers;
