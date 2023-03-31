const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const homeSummarySchema = new Schema({
  lastLogin: { type: String, require: true },
  totalLeads: { type: Number, require: true },
  totalPhone: { type: Number, require: true },
  totalFullz: { type: Number, require: true },
  totalOthers: { type: Number, require: true },
  isSignedOut: { type: Boolean, require: true },
  isSignedIn: { type: Boolean, require: true },
});

module.exports = mongoose.model("Summary", homeSummarySchema);
