/**
Milestone Project for MAPD-713 - Milestone 2
Members: Patrick John Katigbak
         Chun Fung Suen
         Xie Mingyuan
         Yat Man Chan
 */

var DEFAULT_PORT = 5000
var DEFAULT_HOST = '127.0.0.1'
var SERVER_NAME = 'PatientData'

var http = require ('http');
var mongoose = require ("mongoose");

var port = process.env.PORT;
var ipaddress = process.env.IP; // TODO: figure out which IP to use for the heroku

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.  
var uristring = 
  process.env.MONGODB_URI || 
  //'mongodb://127.0.0.1:27017/data';
  'mongodb+srv://MAPD713PatientData:MypsQZXt0GIuzQDF@cluster0.uzxamyj.mongodb.net/?retryWrites=true&w=majority'

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("!!!! Connected to db: " + uristring)
});

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
var patientsSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  address: String,
  date_of_birth: String,
  department: String,
  doctor: String,
  sex: String,
  phone_number: String,
  emergency_contact_first_name: String,
  emergency_contact_last_name: String,
  emergency_contact_phone_number: String,
  date_of_admission: String,
  bed_number: String,
  photo: String,

});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Patients' collection in the MongoDB database
var Patients = mongoose.model('patients', patientsSchema);

var errors = require('restify-errors');
var restify = require('restify')
// Create the restify server
, server = restify.createServer({ name: SERVER_NAME})

if (typeof ipaddress === "undefined") {
  //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
  //  allows us to run/test the app locally.
  console.warn('No process.env.IP var, using default: ' + DEFAULT_HOST);
  ipaddress = DEFAULT_HOST;
};

if (typeof port === "undefined") {
  console.warn('No process.env.PORT var, using default port: ' + DEFAULT_PORT);
  port = DEFAULT_PORT;
};


server.listen(port, ipaddress, function () {
console.log('Server %s listening at %s', server.name, server.url)
console.log('Resources:')
console.log(' /patients')
console.log(' /patients/:id')
})


server
  // Allow the use of POST
  .use(restify.plugins.fullResponse())

  // Maps req.body to req.params
  .use(restify.plugins.bodyParser())


  // Get all patients in the system
  server.get('/patients', function (req, res, next) {
    console.log('GET request: patients');
    // Find every entity within the given collection
    Patients.find({}).exec(function (error, result) {
      if (error) return next(new Error(JSON.stringify(error.errors)))
      res.send(result);
    });
  })


  // Get a patient by their id
  server.get('/patients/:id', function (req, res, next) {
    console.log('GET request: patients/' + req.params.id);

    // Find a single patient by their id
    Patients.find({ _id: req.params.id }).exec(function (error, patients) {
      if (patients) {
        // Send the patients if no issues
        res.send(patients)
      } else {
        // Send 404 header if the patient doesn't exist
        res.send(404)
      }
    })
  })


  // Create a new patient
  server.post('/patients', function (req, res, next) {
    console.log('POST request: patient params=>' + JSON.stringify(req.params));
    console.log('POST request: patient body=>' + JSON.stringify(req.body));
    
    
    // Make sure name is defined
    if (req.body.first_name === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('First Name must be supplied'))
    }
    if (req.body.last_name === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('Last Name must be supplied'))
    }
    if (req.body.address === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('Address must be supplied'))
    }
    if (req.body.date_of_birth === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('Date of Birth must be supplied'))
    }
    if (req.body.last_name === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('Phone Number must be supplied'))
    }
    if (req.body.bed_number === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('Bed Number must be supplied'))
    }
     // Creating new Patient.
     var newPatients = new Patients({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      address: req.body.address,
      date_of_birth: req.body.date_of_birth,
      department: req.body.department,
      doctor: req.body.doctor,
      sex: req.body.sex,
      phone_number: req.body.phone_number,
      emergency_contact_first_name: req.body.emergency_contact_first_name,
      emergency_contact_last_name: req.body.emergency_contact_last_name,
      emergency_contact_phone_number: req.body.emergency_contact_phone_number,
      date_of_admission: req.body.date_of_admission,
      bed_number: req.body.bed_number,
      photo: req.body.photo,
    });

    // Create the patient and saving to db
    newPatients.save(function (error, result) {
      // If there are any errors, pass them to next in the correct format
      if (error) return next(new Error(JSON.stringify(error.errors)))
      // Send the patient if no issues
      res.send(201, result)
    })

  })


  // Delete patient with the given id
  server.del('/patients/:id', function (req, res, next) {
    console.log('DEL request: patients/' + req.params.id);
    Patients.remove({ _id: req.params.id }, function (error, result) {
      // If there are any errors, pass them to next in the correct format
      if (error) return next(new Error(JSON.stringify(error.errors)))

      // Send a 200 OK response
      res.send()
    });
  })