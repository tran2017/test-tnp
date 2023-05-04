const HttpError = require("../models/http-error");
const { validationResult: validate } = require("express-validator");
const user = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { commonValues } = require("../shared/engine");

const signup = async (req, res, next) => {
  const errors = validate(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input data, please try again", 422));
  }

  const { pcId, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (existingUser) {
    return next(new HttpError("Email existed, please try login.", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("Could not create account, please try again", 500));
  }

  const newUser = new user({
    email: email,
    password: hashedPassword,
    pcId: pcId,
    added: new Date(Date.now()).toLocaleString("en-US", { timeZone: "Asia/Bangkok" }) || new Date(Date.now()).toLocaleString(),
  });

  try {
    await newUser.save();
  } catch (error) {
    return next(new HttpError("Create new user failed", 422));
  }

  let token;
  try {
    token = jwt.sign({ userId: newUser.id, email: newUser.email }, ENGINE, { expiresIn: "1h" });
  } catch (error) {
    return next(new HttpError("Could not create account, please try again", 500));
  }

  res.status(201).json({ userId: newUser.id, email: newUser.email, token: token });
};

const signin = async (req, res, next) => {
  const { pcId, email, password } = req.body;
  let existingUser;

  try {
    existingUser = await user.findOne({ email: email });
  } catch (error) {
    return next(new HttpError(error, 422));
  }

  if (!existingUser) {
    return next(new HttpError("Login failed. Please try again", 403));
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password.split("-")[0], existingUser.password);
    if (!isPasswordValid) {
      throw new HttpError("Login failed. Please try again", 500);
    }

    const privateKey = password.split("-")[1];
    if (privateKey !== existingUser.key) {
      return next(new HttpError("Login failed. Please try again", 500));
    }
  } catch (error) {
    return next(new HttpError("Login failed. Please try again", 500));
  }

  const id = existingUser.pcId;
  if (id !== pcId) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  let token;
  try {
    token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.JWT_KEY, { expiresIn: "1h" });
  } catch (error) {
    return next(new HttpError("Invalid account, please try again", 500));
  }

  res.status(200).json({ userId: existingUser.id, email: existingUser.email, token: token });
};

exports.signin = signin;
exports.signup = signup;
