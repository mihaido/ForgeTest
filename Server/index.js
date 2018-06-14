var express = require('express')
var cookieParser = require('cookie-parser')

var app = express()

var allowCrossDomain = function (req, res, next) {
	
  // intercept OPTIONS method
  
	if ('OPTIONS' == req.method) {
    if(req.headers['origin'])
    {
      var origin = req.headers['origin'];
      if(origin)
      {
        res.header('Origin', origin);
        //res.header('Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      }
    }  

    res.send(200);
	}
	else {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

		next();
  }
};
app.use(allowCrossDomain);

app.use(cookieParser());

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

app.use(express.static('D:/Sources/Mihai/ForgeTest/Client'));

//
// standard response if you call this service with no purpose
app.get('/', function (req, res) {
  res.send('Hello World!')
  //res.sendFile('D:/Sources/Mihai/ForgeTest/Client/index.html');
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

//
// add hfdm routes
require('./routes-hfdm.js')(app)

///////////////////////////////////////////////////////////////////////////////////////////////////
// three legged auth
//////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/auth3l', function (req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  AuthUser.setupCredentials(req.query.code, res, req.query.state);
});


app.get('/login', function (req, res) {

  var bDoAuth = false;

  var postAuthRedir = AuthUser.getPostAuthRedirect(req);

  AuthUser.getAndRefreshCredentials(req, res).then(
    function(credentials){
      // redirect directly to end of auth
      res.redirect(postAuthRedir);
    },
    function(error){
      //
      // redirect to auth address
      var url = AuthUser.generateAuthUrl(postAuthRedir);
      res.redirect(url);
    }
  );
});

app.get('/getAuthUserName', function (req, res) {
  var ret = 'anonymous';

  res.setHeader('Content-Type', 'application/json');

  AuthUser.getAndRefreshCredentials(req, res).then(
     function (credentials) {
        var UserProfileApi = new ForgeSDK.UserProfileApi();
        UserProfileApi.getUserProfile(AuthUser.oAuth2, credentials).then(
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
