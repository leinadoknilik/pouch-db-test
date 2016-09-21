var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var mongoose    = require('mongoose');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var User   = require('./app/models/user'); // get our user mongoose model
var Expense   = require('./app/models/expense'); // get our expense mongoose model
var Income   = require('./app/models/income'); // get our income mongoose model

var app = express();
//app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
mongoose.connect(process.env.MONGODB_URI); // connect to database

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });


// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/create-user"
 *    POST: creates a new contact
 */

app.post("/create-user", function(req, res) {
  // create a user
  if(req.body.secret == "nyuszi" && !(req.body.username == "") && !(req.body.password == "")){
    User.findOne({
    		name: req.body.username
    	}, function(err, user) {

    		if (err) throw err;

    		if (!user) {
          var user = new User({
        		name: req.body.username,
        		password: req.body.password,
        		admin: true
        	});
        	user.save(function(err) {
        		if (err) throw err;
        		console.log('User saved successfully');
        		res.json({ success: true });
        	});
    		} else if (user) {
          res.json({ success: false, message:"User already exist!" });
    		}

    	});
}else{
  res.json({ success: false });
}

});

var apiRoutes = express.Router();

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://env/api/authenticate
apiRoutes.post('/authenticate', function(req, res) {

  User.findOne({
  		name: req.body.name
  	}, function(err, user) {

  		if (err) throw err;

  		if (!user) {
  			res.json({ success: false, message: 'Authentication failed. User not found.' });
  		} else if (user) {

  			// check if password matches
  			if (user.password != req.body.password) {
  				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
  			} else {

  				// if user is found and password is right
  				// create a token
  				var token = jwt.sign(user,'superSecret', {
  					expiresIn: 86400 // expires in 24 hours
  				});

  				res.json({
  					success: true,
  					message: 'Enjoy your token!',
  					token: token
  				});
  			}

  		}

  	});
  });

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, 'superSecret', function(err, decoded) {
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});

	}

});


apiRoutes.post("/create-expense", function(req, res) {
  // create a user
          var expense = new Expense({
        		description: req.body.desc,
        		value: req.body.value,
            date: Date.now()
        	});
        	expense.save(function(err) {
        		if (err) throw err;
        		console.log('Expense saved successfully');
        		res.json({ success: true });
        	});
});

apiRoutes.get('/incomes', function(req, res) {
	Income.find({}, function(err, incomes) {
		res.json(incomes);
	});
});

apiRoutes.post("/create-income", function(req, res) {
  // create a user
          var income = new Income({
        		description: req.body.desc,
        		value: req.body.value,
            date: Date.now()
        	});
        	income.save(function(err) {
        		if (err) throw err;
        		console.log('Income saved successfully');
        		res.json({ success: true });
        	});
});

apiRoutes.get('/expenses', function(req, res) {
	Expense.find({}, function(err, expenses) {
		res.json(expenses);
	});
});

apiRoutes.get('/expenses-by-time', function(req, res) {
  console.log(req.params.year);
  console.log(req.params.month);
	Expense.find({"date": {"$gte": new Date(req.params.year+req.params.month)}}, function(err, expenses) {
		res.json(expenses);
	});
});



apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

app.use('/', apiRoutes);
