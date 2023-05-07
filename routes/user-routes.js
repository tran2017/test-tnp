const express = require("express");
const { check } = require("express-validator");
const { check: validate } = require("express-validator");
const userController = require("../controllers/user-controller");
const router = express.Router();

router.post("/sign-up", [validate("email").normalizeEmail().isEmail(), validate("password").isLength({ min: 6 })], userController.signup);

router.post("/sign-in", [validate("email").normalizeEmail().isEmail(), validate("password").isLength({ min: 6 })], userController.signin);

router.put("/update-user", [validate("email").normalizeEmail().isEmail(), validate("productId").isLength({ min: 5 }), validate("pcId").isLength({ min: 5 })], userController.updateUser);

module.exports = router;
