

var ForgeSDK = require('forge-apis');
var Secret = require('./secret.js');

// Initialize the 2-legged OAuth2 client, set specific scopes and optionally set the `autoRefresh` parameter to true
// if you want the token to auto refresh
var autoRefresh = true; // or false
var oAuth2 = new ForgeSDK.AuthClientTwoLegged(Secret.CLIENT_ID, Secret.CLIENT_SECRET, [
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

var ensureValidToken = function (curCredentials) {
    return new Promise(function (resolve, reject) {
        oAuth2.authenticate().then(
            function (credentials) {
                //curr2lCredentials = credentials;
                resolve(credentials);
              },
              function (err) {
                reject(err);
              }
        );
    });
}

module.exports = {

    oAuth2,
    
    ensureValidToken,
    
    getAndRefreshCredentials : function(req, res){
        return new Promise(function (resolve, reject) {

            var bGetCredentials = false;
            var credentials = null;

            if(!req.cookies){
                bGetCredentials = true;
            }
            else{
                currCredentials = req.cookies['credentials_2'];
                
                if(currCredentials){
                    if (new Date(currCredentials.expires_at - 300).getTime() < Date.now()){
                        bGetCredentials = true;
                    }
                    else
                        credentials = currCredentials;
                }
                else{
                    bGetCredentials = true;
                }
            }

            if(bGetCredentials){
                ensureValidToken(currCredentials).then(
                    function(credentials){
                        res.cookie('credentials_2', credentials);
                        resolve(credentials);
                    },
                    function(error){
                        reject(error);
                    });
            }
            else
                resolve(credentials);
        });
    }
}