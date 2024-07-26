const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  illness: String,
  treatment: String,
  medications: [String],
  date: Date
});

const patientSchema = new mongoose.Schema({
  patientID: { type: String, unique: true, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  email: { type: String, unique: true, required: true },
  address: { type: String, required: true },
  phoneNumbers: [String],
  medicalHistory: [medicalHistorySchema]
});

module.exports = mongoose.model('Patient', patientSchema);
