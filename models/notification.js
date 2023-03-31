const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  email: { type: String },
  phone: { type: String },
  fullz: { type: String },
  others: { type: String },
  type: { type: String },
  amount: { type: Number },
  added: { type: String, required: true },
});

module.exports = mongoose.model("Notification", notificationSchema);
