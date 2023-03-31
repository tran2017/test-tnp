const express = require("express");
const { check } = require("express-validator");
const othersController = require("../controllers/others-controller");
const authCheck = require("../middlewares/check-auth");
const router = express.Router();

router.post("/", [check("item").notEmpty(), check("type").notEmpty()], othersController.create);

router.use(authCheck);
router.get("/others-summary", othersController.getOthersSummaryData);
router.get("/download-others/:fromDate/:toDate/:type", othersController.download);

router.get("/get-many/:keyword/:currentPage", othersController.getItemByKeyword);
router.get("/get-data-by-page-number/:currentPage", othersController.getDataByPageNumber);
router.get("/:otherId", othersController.getItemById);

router.delete("/:otherId", othersController.delete);

module.exports = router;
