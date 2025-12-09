const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  text: String,
  delete_password: String,
  created_on: Date,
  reported: { type: Boolean, default: false }
});

const threadSchema = new mongoose.Schema({
  board: String,
  text: String,
  delete_password: String,
  created_on: Date,
  bumped_on: Date,
  reported: { type: Boolean, default: false },
  replies: [replySchema]
});

module.exports = mongoose.model("Thread", threadSchema);
