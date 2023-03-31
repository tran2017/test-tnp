const { v4: uuidv4 } = require("uuid");

const express = require("express");
const HttpError = require("../models/http-error");
const authCheck = require("../middlewares/check-auth");
const homeController = require("../controllers/home-controller");
const router = express.Router();

router.use(authCheck);
router.get("/summary", homeController.getHomeDataSummary);
router.get("/initialize-data", homeController.initializeHomeData);

module.exports = router;
