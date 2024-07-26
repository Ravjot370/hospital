const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  recordID: String,
  AppointmentID: String,
  diagnosis: String,
  Prescriptions: String,
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
