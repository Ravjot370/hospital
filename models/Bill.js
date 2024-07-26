const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billID: String,
  patientID: String,
  amount: Number,
  totalAmount:Number,
});

module.exports = mongoose.model('Bill', billSchema);
