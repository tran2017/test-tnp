const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
const { commonValues } = require("../shared/engine");
module.exports = (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error();
    }

    // const decodedValues = jwt.verify(token, commonValues.JWT_KEY);
    const decodedValues = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedValues.userId };
    next();
  } catch (error) {
    return next(new HttpError("Authentication failed", 401));
  }
};
