const HttpError = require("../models/http-error");
const others = require("../models/other");

const getLatestNotification = async (req, res, next) => {
  try {
    const allOthers = await others.find().exec();
    const convertedOthers = allOthers.map((x) => x.toObject({ getters: true }));
    const todayOthers = convertedOthers.filter((x) => (Date.now() - new Date(x.added)) / 86400000 < 1);

    res.status(202).json({ latestNoti: todayOthers });
  } catch (error) {
    return next(new HttpError("Loading latest notification failed", 500));
  }
};

exports.getLatestNotification = getLatestNotification;
