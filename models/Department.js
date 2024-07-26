const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentID: String,
  departmentName: String,
  Services:String,
});

module.exports = mongoose.model('Department', departmentSchema);
