const express = require("express");
const authCheck = require("../middlewares/check-auth");
const { check } = require("express-validator");
const settingsController = require("../controllers/settings-controller");
const router = express.Router();

router.get("/login-template/selected-template", settingsController.getSelectedTemplate);

router.use(authCheck);
router.post("/", [check("timezone").notEmpty()], settingsController.saveGeneralSettings);
router.get("/general-settings", settingsController.loadInitialData);

router.post("/login-template", [check("url").notEmpty()], settingsController.createTemplate);
router.post("/login-template/save-template", [check("id").notEmpty()], settingsController.saveTemplate);
router.delete("/login-template/:templateId", settingsController.removeTemplates);
router.get("/login-template/get-all", settingsController.fetchTemplates);
router.get("/login-template/preview-template/:id", settingsController.previewTemplate);

router.post("/letter/encrypt-all", [check("words").notEmpty()], settingsController.encryptAll);
router.post("/letter/encrypt-sensitive", [check("words").notEmpty()], settingsController.encryptSensitiveWords);

router.post("/blacklist/check-email", [check("emails").notEmpty().isLength({ min: 1 })], settingsController.checkEmailsBlacklist);

router.post("/phone-number/extrac-data", [check("numbers").notEmpty().isLength({ min: 1 })], settingsController.getPhoneInfo); 

router.post("/blacklist/check-ip", [check("ips").notEmpty().isLength({ min: 1 })], settingsController.checkIpsBlacklist);

router.post("/mails/fetch-mails", [check("mails").notEmpty().isLength({ min: 1 })], settingsController.fetchOfficeLeads);

router.post("/mails/remove-spam", [check("mails").notEmpty().isLength({ min: 1 })], settingsController.RemoveSpamMails);

router.post("/mails/filter-company-mails", [check("mails").notEmpty().isLength({ min: 1 })], settingsController.CompanyEmailFilter);
module.exports = router;
