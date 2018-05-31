
var ForgeSDK = require('forge-apis');
var ItemsAPI = new ForgeSDK.ItemsApi();
var VersionsAPI = new ForgeSDK.VersionsApi();
var DerivativesAPI = new ForgeSDK.DerivativesApi();

var AuthUser = require('./auth-3-leg.js');
var ErrHand = require('./error-handling.js');

var base64Format = require("base64-format");

module.exports = function(app){

    app.get('/getViewerToken', function (req, res) {
        AuthUser.getAndRefreshCredentials(req, res).then(
            function(credentials){
                ErrHand.returnOk(res, {token: credentials.access_token});
            },
            function (error){
                ErrHand.returnErr(res, 'User authentication failed: ' + error['more info']);
        });
    });

    app.get('/getViewableTipVersion', function (req, res) {

        var projId = req.query.projId;
        AuthUser.getAndRefreshCredentials(req, res).then(
            function(credentials){

                ItemsAPI.getItemTip(projId, req.query.itemId, AuthUser.oAuth2, credentials).then(
                    function (result) {
                        
                        var itemId = result.body.data.id;
                        var itemIdB64 = Buffer.from(itemId).toString("base64");
                        var itemIdB64Safe = base64Format({from:"base64", to:"rfc4648_ni"}, itemIdB64);

                        DerivativesAPI.getManifest(itemIdB64Safe, null, AuthUser.oAuth2, credentials).then(
                            function (result) {
                                ErrHand.returnOk(res, result);
                            },
                            function (err) {
                                ErrHand.returnErr(res, err.statusMessage);
                            });
                    },
                    function (err) {
                        ErrHand.returnErr(res, err.statusMessage);
                    });
                
            },
            function (error){
                ErrHand.returnErr(res, 'User authentication failed: ' + error['more info']);
        });
    });
}