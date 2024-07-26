const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentID: String,
  patientID: String,
  doctorID: String,
  appointmentDate: Date,
  appointmentDuration:String,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
