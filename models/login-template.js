const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const templateSchema = new Schema({
  url: { type: String, required: true , unique: true },
  isSelected: { type: Boolean },
  added: { type: String, required: true },
});

templateSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Template", templateSchema);
