const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const leadsSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  country: { type: String },
  provider: { type: String },
  added: { type: String, required: true },
});

leadsSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Lead", leadsSchema);
