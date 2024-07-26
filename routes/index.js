const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Bill = require('../models/Bill');
const Department = require('../models/Department');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // Import uuid library for generating unique IDs


// Render login page
router.get('/', (req, res) => {
  res.render('login');
});

// Handle login form submission
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  try {
    const user = await User.findOne({ username, role });
    
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userID = user._id;
      req.session.role = role;
      
      if (role === 'patient') {
        res.redirect('/patient-dashboard');
      } else if (role === 'doctor') {
        res.redirect('/doctor-dashboard');
      } else if (role === 'admin') {
        res.redirect('/admin-dashboard');
      } else if (role === 'staff') {
        res.redirect('/staff-view');
      } else {
        res.redirect('/');
      }
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/');
  }
});

// Render signup page
router.get('/signup', (req, res) => {
  res.render('signup');
});
// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out.');
    }
    res.redirect('/');
  });
});

// Handle signup form submission
router.post('/signup', async (req, res) => {
  const { username, password, role } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      userID: uuidv4(),
      username,
      password: hashedPassword,
      role
    });
    
    await newUser.save();
    res.redirect('/');
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/signup');
  }
});

// Render patient dashboard
router.get('/patient-dashboard', (req, res) => {
  res.render('patient-dashboard');
});

// Render book appointment page
router.get('/book-appointment', (req, res) => {
  res.render('bookAppointment');
});
// Route to render the book appointment page with a list of doctors
// router.get('/book-appointment', async (req, res) => {
//   try {
//     const doctors = await Doctor.find(); // Fetch doctors from the database
//     res.render('book-appointment', { doctors }); // Pass doctors to the view
//   } catch (error) {
//     console.error('Error fetching doctors:', error);
//     res.status(500).send('Error fetching doctors.');
//   }
// });

router.post('/book-appointment', async (req, res) => {
  try {
    const { doctorID, appointmentDate, appointmentDuration } = req.body;

    // Generate unique IDs
    const appointmentID = uuidv4();
    const patientID = uuidv4();
    
    // Create a new appointment
    const newAppointment = new Appointment({
      appointmentID,
      patientID, // Use autogenerated patientID
      doctorID, // Use provided doctorID
      appointmentDate,
      appointmentDuration
    });

    await newAppointment.save();
    res.redirect('/appointment-confirmation'); // Redirect to the confirmation page
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.render('book-appointment', { error: 'Error booking appointment. Please try again.' });
  }
});

// Render doctor dashboard
// router.get('/doctor-dashboard', (req, res) => {
//   res.render('doctor-dashboard');
// });
// Render doctor dashboard with assigned patients
router.get('/doctor-dashboard', async (req, res) => {
  try {
    // Fetch all patients
    const patients = await Patient.find();

    // Fetch all doctors
    // const doctors = await Doctor.find();

    // Render the doctor dashboard with data
    res.render('doctor-dashboard', {  patients });
  } catch (error) {
    console.error('Error fetching doctor dashboard data:', error);
    res.status(500).send('Error fetching dashboard data.');
  }
});


// Render appointment summary report
router.get('/appointment-summary-report', (req, res) => {
  // Generate report data here
  res.render('appointment-summary-report');
});

// Render patient demographics report
router.get('/patient-demographics-report', (req, res) => {
  // Generate report data here
  res.render('patient-demographics-report');
});

// Route to render the account creation form
router.get('/create-account', (req, res) => {
  res.render('create-account');
});

router.get('/appointment-confirmation', (req, res) => {
  res.render('appointment-confirmation');
});
// Route to view doctors page
router.get('/view-doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find(); // Fetch doctors from the database
    res.render('view-doctors', { doctors }); // Pass doctors to the view
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).send('Error fetching doctors.');
  }
});
router.post('/create-account', async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, email, address, phoneNumbers } = req.body;

    // Ensure required fields are present and not null
    if (!firstName || !lastName || !dateOfBirth || !email || !address) {
      return res.render('create-account', { error: 'All fields are required.' });
    }

    // Ensure phoneNumbers is an array if it's coming as a comma-separated string
    const phoneNumbersArray = phoneNumbers ? phoneNumbers.split(',').map(num => num.trim()) : [];

    const newPatient = new Patient({
      patientID: uuidv4(),
      firstName,
      lastName,
      dateOfBirth,
      email,
      address,
      phoneNumbers: phoneNumbersArray
    });

    await newPatient.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Error creating account:', error); // Log error details

    if (error.code === 11000) {
      // Handle duplicate key error
      res.render('create-account', { error: 'Account with this email or patient ID already exists.' });
    } else {
      res.render('create-account', { error: 'Error creating account. Please try again.' });
    }
  }
});
// Route to search patients
router.get('/search-patients', async (req, res) => {
  try {
    const { name, id, phoneNumber } = req.query;

    let query = {};
    if (name) {
      query = { ...query, $or: [{ firstName: new RegExp(name, 'i') }, { lastName: new RegExp(name, 'i') }] };
    }
    if (id) {
      query = { ...query, patientID: id };
    }
    if (phoneNumber) {
      query = { ...query, phoneNumbers: phoneNumber };
    }

    const patients = await Patient.find(query);
    res.render('search-results', { patients });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).send('Error searching for patients.');
  }
});
// Route to get the update form
router.get('/update-patient/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    res.render('update-patient', { patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).send('Error fetching patient information.');
  }
});

// Route to handle patient update
router.post('/update-patient/:id', async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, email, address, phoneNumbers, medicalHistory } = req.body;

    const updatedPatient = {
      firstName,
      lastName,
      dateOfBirth,
      email,
      address,
      phoneNumbers: phoneNumbers.split(',').map(num => num.trim()),
      medicalHistory: JSON.parse(medicalHistory)
    };

    await Patient.findByIdAndUpdate(req.params.id, updatedPatient);
    res.redirect('/patients');
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).send('Error updating patient information.');
  }
});
// Route to view patient details
router.get('/view-patient/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    res.render('view-patient', { patient });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).send('Error fetching patient details.');
  }
});
// Route to view medical records
router.get('/medical-records', async (req, res) => {
  try {
    const records = await MedicalRecord.find();
    res.render('medical-records', { records });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).send('Error fetching medical records.');
  }
});
// Route to display the form for creating a new medical record
router.get('/medical-records/new', (req, res) => {
  res.render('create-medical-record');
});

// Route to handle the form submission and create a new medical record
router.post('/medical-records', async (req, res) => {
  try {
    const { appointmentID, diagnosis, prescriptions } = req.body;

    const newRecord = new MedicalRecord({
      recordID: uuidv4(),
      appointmentID,
      diagnosis,
      prescriptions,
    });

    await newRecord.save();
    res.redirect('/medical-records');
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).send('Error creating medical record.');
  }
});

// Render the manage appointments page
router.get('/manage-appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.render('manage-appointments', { appointments });
  } catch (error) {
    console.error('Error fetching appointments for management:', error);
    res.status(500).send('Error fetching appointments for management.');
  }
});

// Render the view appointments page
router.get('/view-appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.render('view-appointments', { appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).send('Error fetching appointments.');
  }
});

// Render the edit appointment page
router.get('/edit-appointment/:appointmentID', async (req, res) => {
  try {
    const { appointmentID } = req.params;
    const appointment = await Appointment.findOne({ appointmentID });
    if (!appointment) {
      return res.status(404).send('Appointment not found');
    }
    res.render('edit-appointment', { appointment });
  } catch (error) {
    console.error('Error fetching appointment for editing:', error);
    res.status(500).send('Error fetching appointment for editing.');
  }
});

// Handle the update appointment form submission
router.post('/update-appointment/:appointmentID', async (req, res) => {
  try {
    const { appointmentID } = req.params;
    const { doctorID, appointmentDate, appointmentDuration } = req.body;
    
    await Appointment.findOneAndUpdate(
      { appointmentID },
      { doctorID, appointmentDate, appointmentDuration },
      { new: true }
    );
    
    res.redirect('/manage-appointments');
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).send('Error updating appointment.');
  }
});

// Handle appointment deletion
router.get('/delete-appointment/:appointmentID', async (req, res) => {
  try {
    const { appointmentID } = req.params;
    await Appointment.findOneAndDelete({ appointmentID });
    res.redirect('/manage-appointments');
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).send('Error deleting appointment.');
  }
});
// Ge
// Render admin dashboard
router.get('/admin-dashboard', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.render('admin-dashboard', { doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).send('Error fetching doctors.');
  }
});

// Render create doctor form
router.get('/create-doctor', (req, res) => {
  res.render('create-doctor');
});
// Render admin dashboard
router.get('/admin-dashboard', async (req, res) => {
  try {
    const doctors = await Doctor.find(); // Fetch doctors from the database
    res.render('admin-dashboard', { doctors }); // Pass doctors to the view
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).send('Error fetching doctors.');
  }
});

// Handle creating a new doctor
router.post('/create-doctor', async (req, res) => {
  try {
    const { firstName, lastName, specialization, phoneNumbers, experienceYears, email, departmentID } = req.body;

    const newDoctor = new Doctor({
      doctorID: uuidv4(),
      firstName,
      lastName,
      specialization,
      phoneNumbers: phoneNumbers.split(',').map(num => num.trim()),
      experienceYears,
      email,
      departmentID
    });

    await newDoctor.save();
    res.redirect('/admin-dashboard');
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.render('create-doctor', { error: 'Error creating doctor. Please try again.' });
  }
});

// Render update doctor form
router.get('/update-doctor/:doctorID', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorID: req.params.doctorID });
    if (!doctor) {
      return res.status(404).send('Doctor not found');
    }
    res.render('update-doctor', { doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).send('Error fetching doctor.');
  }
});

// Handle updating a doctor
router.post('/update-doctor/:doctorID', async (req, res) => {
  try {
    const { doctorID } = req.params;
    const { firstName, lastName, specialization, phoneNumbers, experienceYears, email, departmentID } = req.body;

    await Doctor.findOneAndUpdate(
      { doctorID },
      { firstName, lastName, specialization, phoneNumbers: phoneNumbers.split(',').map(num => num.trim()), experienceYears, email, departmentID },
      { new: true }
    );

    res.redirect('/admin-dashboard');
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).send('Error updating doctor.');
  }
});

// Handle deleting a doctor
router.delete('/delete-doctor/:doctorID', async (req, res) => {
  try {
    const result = await Doctor.findOneAndDelete({ doctorID: req.params.doctorID });
    if (!result) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});
// Render staff view
router.get('/staff-view', (req, res) => {
  res.render('staff-view');
});
// Route to get the appointment summary report
router.get('/appointment-summary-report', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let appointments;
    switch (type) {
      case 'daily':
        appointments = await Appointment.aggregate([
          { $match: query },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);
        break;
      case 'weekly':
        appointments = await Appointment.aggregate([
          { $match: query },
          { $group: { _id: { $isoWeek: "$appointmentDate" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);
        break;
      case 'monthly':
        appointments = await Appointment.aggregate([
          { $match: query },
          { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$appointmentDate" } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);
        break;
      case 'financial':
        // Assuming you have a Billing model and related financial data
        // This part is a placeholder; you need to adjust it based on your actual data schema
        appointments = []; // Fetch and aggregate billing data here
        break;
      case 'staff-performance':
        // Assuming you have a staff performance data model or logic
        // This part is a placeholder; you need to adjust it based on your actual data schema
        appointments = []; // Fetch and aggregate staff performance data here
        break;
      case 'custom':
        // Custom logic based on specific criteria
        appointments = await Appointment.find(query);
        break;
      default:
        appointments = [];
    }

    res.render('appointment-summary-report', { appointments, reportType: type });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).send('Error generating report.');
  }
});

module.exports = router;
