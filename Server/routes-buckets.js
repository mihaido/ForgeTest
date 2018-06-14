
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
var createBucket = function (bucketKey, credentials) {
    console.log("**** Creating Bucket : " + bucketKey);
    var createBucketJson = { 'bucketKey': bucketKey, 'policyKey': 'temporary' };
    return BucketsApi.createBucket(createBucketJson, {}, AuthApp.oAuth2, credentials);
};

/**
 * Gets the details of a bucket specified by a bucketKey.
 * Uses the oAuth2TwoLegged object that you retrieved previously.
 * @param bucketKey
 */
var getBucketDetails = function (bucketKey, credentials) {
    console.log("**** Getting bucket details : " + bucketKey);
    return BucketsApi.getBucketDetails(bucketKey, AuthApp.oAuth2, credentials);
};

/**
 * This function first makes an API call to getBucketDetails endpoint with the provided bucketKey.
 * If the bucket doesn't exist - it makes another call to createBucket endpoint.
 * @param bucketKey
 * @returns {Promise - details of the bucket in Forge}
 */
var createBucketIfNotExist = function (bucketKey, credentials) {
    console.log("**** Creating bucket if not exist :", bucketKey);

    return new Promise(function (resolve, reject) {
        getBucketDetails(bucketKey, credentials).then(
            function (resp) {
                resolve(resp);
            },
            function (err) {
                if (err.statusCode === 404) {
                    createBucket(bucketKey, credentials).then(function (res) {
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

        AuthApp.getAndRefreshCredentials(req, res).then(
        function(credentials){
            BucketsApi.getBuckets({}, AuthApp.oAuth2, credentials).then(
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
        
        AuthApp.getAndRefreshCredentials(req, res).then(
            function(credentials){

                //
                // buckets names have restrictions:
                // "Bucket key must match "^[-_.a-z0-9]{3,128}$"
                // That is bucket must be between 3 to 128 characters long and contain only lowercase letters, numbers and the symbols . _ -"
                name = encodeURIComponent(name).toLowerCase();

                createBucketIfNotExist(name /*+ '_' + Secret.CLIENT_ID.toLowerCase()*/, credentials).then(
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
    
    app.post('/delBucket', function (req, res) {
    
        var name = req.body.name;
    
        AuthApp.getAndRefreshCredentials(req, res).then(
            function(credentials){

                //
                // buckets names have restrictions:
                // "Bucket key must match "^[-_.a-z0-9]{3,128}$"
                // That is bucket must be between 3 to 128 characters long and contain only lowercase letters, numbers and the symbols . _ -"
                name = encodeURIComponent(name).toLowerCase();

                BucketsApi.deleteBucket(name, AuthApp.oAuth2, credentials).then(
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
    
        AuthApp.getAndRefreshCredentials(req, res).then( 
            function (credentials) {

                //
                // buckets names have restrictions:
                // "Bucket key must match "^[-_.a-z0-9]{3,128}$"
                // That is bucket must be between 3 to 128 characters long and contain only lowercase letters, numbers and the symbols . _ -"
                name = encodeURIComponent(name).toLowerCase();

                ObjectsApi.getObjects(name, null, AuthApp.oAuth2, credentials).then(
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
    
        AuthApp.getAndRefreshCredentials(req, res).then( 
            function (credentials) {

                //
                // buckets names have restrictions:
                // "Bucket key must match "^[-_.a-z0-9]{3,128}$"
                // That is bucket must be between 3 to 128 characters long and contain only lowercase letters, numbers and the symbols . _ -"
                bucketName = encodeURIComponent(bucketName).toLowerCase();

                ObjectsApi.uploadObject(bucketName, fileName, fileData.size, fileData.buffer, {}, AuthApp.oAuth2, credentials).then(
                    function (info) {
                        ErrHand.returnOk(res, {objectId:info.body.objectId, objectKey:info.body.objectKey});
                    }, 
                    function (err) {
                        ErrHand.returnErr(res, err.statusMessage);
                    })
            },
            function (error) {
                ErrHand.returnErr(res, 'Application authentication failed: ' + error['more info']);
            });
    });

    app.get('/downloadFile', function (req, res) {
        
        var bucketName = req.query.bucketName;
        var fileName = req.query.fileName;
    
        AuthApp.getAndRefreshCredentials(req, res).then( 
            function (credentials) {

                //
                // buckets names have restrictions:
                // "Bucket key must match "^[-_.a-z0-9]{3,128}$"
                // That is bucket must be between 3 to 128 characters long and contain only lowercase letters, numbers and the symbols . _ -"
                bucketName = encodeURIComponent(bucketName).toLowerCase();

                ObjectsApi.getObject(bucketName, fileName, {}, AuthApp.oAuth2, credentials).then(
                    function (info) {
                        res.setHeader('Content-Length', info.headers['content-length']);
                        res.writeHead(200);
                        res.write(info.body);
                        
                        res.end();
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
    
        AuthApp.getAndRefreshCredentials(req, res).then( 
            function(credentials){

                //
                // buckets names have restrictions:
                // "Bucket key must match "^[-_.a-z0-9]{3,128}$"
                // That is bucket must be between 3 to 128 characters long and contain only lowercase letters, numbers and the symbols . _ -"
                name = encodeURIComponent(name).toLowerCase();

                ObjectsApi.deleteObject(bucketName, name, AuthApp.oAuth2, credentials).then(
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