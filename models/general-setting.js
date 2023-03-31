const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const generalSettingsSchema = new Schema({
  timezone: { type: String, required: true },
  phoneKey: { type: String },
});

module.exports = mongoose.model("GeneralSetting", generalSettingsSchema);
