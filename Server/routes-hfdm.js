
var HFDM = require('@adsk/forge-hfdm');

// Instantiate HFDM object
var hfdm = new HFDM.HFDM();

var AuthUser = require('./auth-3-leg.js');

var hfdmUrl = 'https://developer.api.autodesk.com/hfdm';



module.exports = function(app){
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // buckets editing - Buckets API
    //////////////////////////////////////////////////////////////////////////////////////////////////

    app.get('/hfdmConnect', function (req, res) {
        AuthUser.getAndRefreshCredentials(req, res).then(
            function(credentials){
                
                var getBearerToken = function(callback){
                    callback(null, credentials.access_token);
                }

                hfdm.connect({
                    serverUrl: hfdmUrl,
                    getBearerToken: getBearerToken
                }).then(function(){
                    console.log('Successfully connected to HFDM!');
                }).catch(function(error){
                    console.error('Failed to connect', error);
                });
            },
            function (error){
                ErrHand.returnErr(res, 'User authentication failed: ' + error['more info']);
        });
    })

    app.get('/hfdmGetCommits', function (req, res) {
        AuthUser.getAndRefreshCredentials(req, res).then(
            function(credentials){
                
                var commitNodeUid = req.query.cn;

                var getBearerToken = function(callback){
                    callback(null, credentials.access_token);
                }

                hfdm.connect({
                    serverUrl: hfdmUrl,
                    getBearerToken: getBearerToken
                }).then(function(){
                    console.log('Successfully connected to HFDM!');

                    var node = hfdm.getCommit(commitNodeUid);
                    var parents = node.getParents();
                    
                }).catch(function(error){
                    console.error('Failed to connect', error);
                });
            },
            function (error){
                ErrHand.returnErr(res, 'User authentication failed: ' + error['more info']);
        });
    })
}