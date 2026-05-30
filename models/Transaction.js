const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  email: String,
  amount: Number,
  type: String,
  category: String,
  month: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);