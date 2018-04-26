

var ForgeSDK = require('forge-apis');
var Secret = require('./secret.js');

// Initialize the 2-legged OAuth2 client, set specific scopes and optionally set the `autoRefresh` parameter to true
// if you want the token to auto refresh
var autoRefresh = true; // or false
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

module.exports = {
    ensureValidToken : function () {
        return new Promise(function (resolve, reject) {
            oAuth2TwoLegged.authenticate().then(
                function (credentials) {
                    curr2lCredentials = credentials;
                    resolve({auth:oAuth2TwoLegged, credentials:curr2lCredentials});
                  },
                  function (err) {
                    reject(err);
                  }
            );
        });
    }
}