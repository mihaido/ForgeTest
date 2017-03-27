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

var ForgeSDK = require('forge-apis');
var Secret = require('./secret.js');

// Initialize the 2-legged OAuth2 client, set specific scopes and optionally set the `autoRefresh` parameter to true
// if you want the token to auto refresh
var autoRefresh = true; // or false

//
// this is needed for buckets operations
var oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(Secret.CLIENT_ID, Secret.CLIENT_SECRET, [
	'user-profile:read',
	'data:read',
	'data:write',
	'data:create',
	'data:search',
	'bucket:read',
	'bucket:create',
	'bucket:update',
	'bucket:delete',
	'code:all',
	'account:read',
	'account:write'
], autoRefresh);

var BucketsApi = new ForgeSDK.BucketsApi(); // Buckets Client


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

var returnErr = function (result, errorString) {
   result.writeHead(400);

   var error;
   if (null == errorString)
      error = '{\"statusMessage\":\"failed\"}';
   else
      error = '{\"statusMessage\":\"' + errorString + '\"}';

   result.end(error);
}

var returnOk = function (result, data) {
   result.writeHead(200);

   var json;
   if (null != data)
      json = JSON.stringify(data);
   else
      json = null;

   result.end(json);
}



app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/getBuckets', function (req, res) {
  oAuth2TwoLegged.authenticate().then(
    function(credentials){
      BucketsApi.getBuckets({}, oAuth2TwoLegged, credentials).then(
        function (buckets) {
          returnOk(res, buckets);
        },
        function (err) {
          returnErr(res, err.statusMessage);
        });
    },
    function (error){
      res.send('Authentication failed: ' + error['more info']);
    });
})

app.post('/addBucket', function (req, res) {

  var name = req.body.name;

  oAuth2TwoLegged.authenticate().then(
    function(credentials){
      createBucketIfNotExist(name + '_' + Secret.CLIENT_ID.toLowerCase()).then(
        function () {
          returnOk(res);
        },
        function (err) {
          returnErr(res, err.statusMessage);
        }
      );
    },
    function (error){
      res.send('Authentication failed: ' + error['more info']);
    });
})

app.post('/delBucket', function (req, res) {

  var name = req.body.name;

  oAuth2TwoLegged.authenticate().then(
    function(credentials){
      BucketsApi.deleteBucket(name, oAuth2TwoLegged, credentials).then(
				function () {
					returnOk(res);
				},
				function (err) {
					returnErr(res, err.statusMessage);
				});
    },
    function (error){
      res.send('Authentication failed: ' + error['more info']);
    });
})


///////////////////////////////////////////////////////////////////////////////////////////////////
// buckets utils
///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Create a new bucket.
 * Uses the oAuth2TwoLegged object that you retrieved previously.
 * @param bucketKey
 */
var createBucket = function (bucketKey) {
   console.log("**** Creating Bucket : " + bucketKey);
   var createBucketJson = { 'bucketKey': bucketKey, 'policyKey': 'temporary' };
   return BucketsApi.createBucket(createBucketJson, {}, oAuth2TwoLegged, oAuth2TwoLegged.getCredentials());
};

/**
 * Gets the details of a bucket specified by a bucketKey.
 * Uses the oAuth2TwoLegged object that you retrieved previously.
 * @param bucketKey
 */
var getBucketDetails = function (bucketKey) {
   console.log("**** Getting bucket details : " + bucketKey);
   return BucketsApi.getBucketDetails(bucketKey, oAuth2TwoLegged, oAuth2TwoLegged.getCredentials());
};

/**
 * This function first makes an API call to getBucketDetails endpoint with the provided bucketKey.
 * If the bucket doesn't exist - it makes another call to createBucket endpoint.
 * @param bucketKey
 * @returns {Promise - details of the bucket in Forge}
 */
var createBucketIfNotExist = function (bucketKey) {
   console.log("**** Creating bucket if not exist :", bucketKey);

   return new Promise(function (resolve, reject) {
      getBucketDetails(bucketKey).then(function (resp) {
         resolve(resp);
      },
         function (err) {
            if (err.statusCode === 404) {
               createBucket(bucketKey).then(function (res) {
                  resolve(res);
               },
                  function (err) {
                     reject(err);
                  })
            }
            else {
               reject(err);
            }
         });
   });
};


