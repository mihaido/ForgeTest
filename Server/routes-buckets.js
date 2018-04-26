
var Secret = require('./secret.js');

var AuthApp = require('./auth-2-leg.js');
var ErrHand = require('./error-handling.js');

var ForgeSDK = require('forge-apis');
var BucketsApi = new ForgeSDK.BucketsApi(); // Buckets Client
var ObjectsApi = new ForgeSDK.ObjectsApi();

var multer = require('multer')
var upload = multer(/*{ dest: 'uploads/' }*/)

///////////////////////////////////////////////////////////////////////////////////////////////////
// buckets utils
///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Create a new bucket.
 * Uses the oAuth2TwoLegged object that you retrieved previously.
 * @param bucketKey
 */
var createBucket = function (bucketKey, authInfo) {
    console.log("**** Creating Bucket : " + bucketKey);
    var createBucketJson = { 'bucketKey': bucketKey, 'policyKey': 'temporary' };
    return BucketsApi.createBucket(createBucketJson, {}, authInfo.auth, authInfo.credentials);
};

/**
 * Gets the details of a bucket specified by a bucketKey.
 * Uses the oAuth2TwoLegged object that you retrieved previously.
 * @param bucketKey
 */
var getBucketDetails = function (bucketKey, authInfo) {
    console.log("**** Getting bucket details : " + bucketKey);
    return BucketsApi.getBucketDetails(bucketKey, authInfo.auth, authInfo.credentials);
};

/**
 * This function first makes an API call to getBucketDetails endpoint with the provided bucketKey.
 * If the bucket doesn't exist - it makes another call to createBucket endpoint.
 * @param bucketKey
 * @returns {Promise - details of the bucket in Forge}
 */
var createBucketIfNotExist = function (bucketKey, authInfo) {
    console.log("**** Creating bucket if not exist :", bucketKey);

    return new Promise(function (resolve, reject) {
        getBucketDetails(bucketKey, authInfo).then(function (resp) {
        resolve(resp);
        },
        function (err) {
            if (err.statusCode === 404) {
                createBucket(bucketKey, authInfo).then(function (res) {
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

module.exports = function(app){
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // buckets editing - Buckets API
    //////////////////////////////////////////////////////////////////////////////////////////////////

    app.get('/getBuckets', function (req, res) {

        AuthApp.ensureValidToken().then(
        function(authInfo){
            BucketsApi.getBuckets({}, authInfo.auth, authInfo.credentials).then(
            function (buckets) {
                ErrHand.returnOk(res, buckets);
            },
            function (err) {
                ErrHand.returnErr(res, err.statusMessage);
            });
        },
        function (error){
            ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
        });
    })
  
    app.post('/addBucket', function (req, res) {
    
        var name = req.body.name;
    
        AuthApp.ensureValidToken().then(
        function(authInfo){
            createBucketIfNotExist(name + '_' + Secret.CLIENT_ID.toLowerCase(), authInfo).then(
            function () {
                ErrHand.returnOk(res);
            },
            function (err) {
                ErrHand.returnErr(res, err.statusMessage);
            }
            );
        },
        function (error){
            ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
        });
    })
    
    app.post('/delBucket', function (req, res) {
    
        var name = req.body.name;
    
        AuthApp.ensureValidToken().then(
        function(authInfo){
            BucketsApi.deleteBucket(name, authInfo.auth, authInfo.credentials).then(
                    function () {
                        ErrHand.returnOk(res);
                    },
                    function (err) {
                        ErrHand.returnErr(res, err.statusMessage);
                    });
        },
        function (error){
            ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
        });
    })
    
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // buckets contents editing - Objects API
    //////////////////////////////////////////////////////////////////////////////////////////////////
    app.get('/getBucketContent', function (req, res) {
    
        res.setHeader('Content-Type', 'application/json');
    
        var name = req.query.name;
    
        AuthApp.ensureValidToken().then( 
        function (authInfo) {
            ObjectsApi.getObjects(name, null, authInfo.auth, authInfo.credentials).then(
            function (result) {
                ErrHand.returnOk(res, result);
            },
            function (err) {
                ErrHand.returnErr(res, err.statusMessage);
            });
        },
        function (error) {
            ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
        });
    });
    
    app.post('/uploadFile', upload.single('fileData'), function (req, res) {
        
        var bucketName = req.body.bucketName;
        var fileName = req.body.fileName;
        var fileData = req.file;
    
        AuthApp.ensureValidToken().then( 
            function (authInfo) {
                ObjectsApi.uploadObject(bucketName, fileName, fileData.size, fileData.buffer, {}, authInfo.auth, authInfo.credentials).then(
                    function (info) {
                        ErrHand.returnOk(res);
                    }, 
            function (err) {
                        ErrHand.returnErr(res, err.statusMessage);
                    })
            },
            function (error) {
                ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
            });
    });
    
    app.post('/delBucketItem', function (req, res) {
    
        var bucketname = req.body.bucketname;
        var name = req.body.name;
    
        AuthApp.ensureValidToken().then( 
        function(authInfo){
            ObjectsApi.deleteObject(bucketName, name, authInfo.auth, authInfo.credentials).then(
                    function () {
                        ErrHand.returnOk(res);
                    },
                    function (err) {
                        ErrHand.returnErr(res, err);
                    });
        },
        function (error){
            ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
        });
    })
}