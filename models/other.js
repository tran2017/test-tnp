const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const otherSchema = new Schema({
  item: { type: String, required: true, unique: true },
  type: { type: String },
  added: { type: String, required: true },
});

otherSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Other", otherSchema);
