var express = require('express')
var app = express()

var allowCrossDomain = function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	}
	else {
		next();
	}
};
app.use(allowCrossDomain);

var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//
// not used here right now
//var multer = require('multer')
//var upload = multer(/*{ dest: 'uploads/' }*/) 

var ForgeSDK = require('forge-apis');

var AuthUser = require('./auth-3-leg.js');
var ErrHand = require('./error-handling.js');



app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

//
// standard response if you call this service with no purpose
app.get('/', function (req, res) {
  res.send('Hello World!')
})

//
// add buckets editing routes
require('./routes-buckets.js')(app)

//
// add hubs editing routes
require('./routes-hubs.js')(app)

//
// add derivatives routes
require('./routes-derivatives.js')(app)


///////////////////////////////////////////////////////////////////////////////////////////////////
// three legged auth
//////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/auth3l', function (req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  AuthUser.setupCredentials(req.query.code, res);
});

app.get('/login', function (req, res) {

  var url = AuthUser.generateAuthUrl();
  res.redirect(url);
});

app.get('/getAuthUserName', function (req, res) {
  var ret = 'anonymous';

  res.setHeader('Content-Type', 'application/json');

  AuthUser.ensureValidToken().then(
     function (result) {
        var UserProfileApi = new ForgeSDK.UserProfileApi();
        UserProfileApi.getUserProfile(result.auth, result.credentials).then(
           function (user) {
              ErrHand.returnOk(res, { name: user.body.firstName + ' ' + user.body.lastName });
           },
           function (error) {
              ErrHand.returnErr(res, error);
           });
     },
     function (error) {
       ErrHand.returnErr(res, 'User authentication failed: ' + error['more info']);
     });
});
