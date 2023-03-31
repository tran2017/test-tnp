const express = require("express");
const { check } = require("express-validator");
const notifiControler = require("../controllers/notification-controller");
const authCheck = require("../middlewares/check-auth");
const router = express.Router();

router.get("/notifi-summary", notifiControler.getLatestNotification);

module.exports = router;