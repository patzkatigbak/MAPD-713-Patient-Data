var DEFAULT_PORT = 5000
var DEFAULT_HOST = '127.0.0.1'
var SERVER_NAME = 'patientApp'

var http = require ('http');
var mongoose = require ("mongoose");

var port = process.env.PORT;
var ipaddress = process.env.IP; // TODO: figure out which IP to use for the heroku

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.  
var uristring = 
  process.env.MONGODB_URI || 
  'mongodb://127.0.0.1:27017/data';
  // 'mongodb+srv://MAPD713PatientData:AYEZGNZeFw9cclQk@cluster0.uzxamyj.mongodb.net/?retryWrites=true&w=majority'

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
var loginSchema = new mongoose.Schema({
  userid: String, 
  password: String
});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Patients' collection in the MongoDB database
var Login = mongoose.model('Login', loginSchema);

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
console.log(' /login')
console.log(' /login/:id')
})


server
  // Allow the use of POST
  .use(restify.plugins.fullResponse())

  // Maps req.body to req.params
  .use(restify.plugins.bodyParser())


  // Get all login in the system
  server.get('/login', function (req, res, next) {
    console.log('GET request: login');
    // Find every entity within the given collection
    Login.find({}).exec(function (error, result) {
      if (error) return next(new Error(JSON.stringify(error.errors)))
      res.send(result);
    });
  })


  // // Get a single patient by their patient id
  // server.get('/patient/:id', function (req, res, next) {
  //   console.log('GET request: patient/' + req.params.id);

  //   // Find a single patient by their id
  //   Patient.find({ _id: req.params.id }).exec(function (error, patient) {
  //     if (patient) {
  //       // Send the patient if no issues
  //       res.send(patient)
  //     } else {
  //       // Send 404 header if the patient doesn't exist
  //       res.send(404)
  //     }
  //   })
  // })


  // Create a new login user
  server.post('/login', function (req, res, next) {
    console.log('POST request: login params=>' + JSON.stringify(req.params));
    console.log('POST request: login body=>' + JSON.stringify(req.body));
    // Make sure name is defined
    if (req.body.userid === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('first_name must be supplied'))
    }
    if (req.body.password === undefined) {
      // If there are any errors, pass them to next in the correct format
      return next(new errors.BadRequestError('last_name must be supplied'))
    }

    // Creating new Login.
    var newLogin = new Login({
      userid: req.body.userid,
      password: req.body.password
    });

    // Create the login and saving to db
    newLogin.save(function (error, result) {
      // If there are any errors, pass them to next in the correct format
      if (error) return next(new Error(JSON.stringify(error.errors)))
      // Send the login if no issues
      res.send(201, result)
    })
  })


  // Delete login with the given id
  server.del('/login/:id', function (req, res, next) {
    console.log('DEL request: login/' + req.params.id);
    Login.remove({ _id: req.params.id }, function (error, result) {
      // If there are any errors, pass them to next in the correct format
      if (error) return next(new Error(JSON.stringify(error.errors)))

      // Send a 200 OK response
      res.send()
    });
  })