
var ForgeSDK = require('forge-apis');
var Secret = require('./secret.js');

var autoRefresh = true; // or false

var REDIRECT_URL = 'http://localhost:3000/auth3l';
var oAuth2ThreeLegged = new ForgeSDK.AuthClientThreeLegged(Secret.CLIENT_ID, Secret.CLIENT_SECRET, 
  REDIRECT_URL, 
[
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
var continueUrl = 'http://bucs4bu0930:8080';
var curr3lCredentials;

module.exports = {

    setupCredentials : function(authorizationCode, res){
        oAuth2ThreeLegged.getToken(authorizationCode).then(
        function (credentials) {
            curr3lCredentials = credentials;
            res.writeHead(301, { Location: continueUrl });
            res.end();
        },
        function (error) {
        });
    },

    generateAuthUrl : function() {
        return oAuth2ThreeLegged.generateAuthUrl();
    },

    ensureValidToken : function () {
        return new Promise(function (resolve, reject) {
           //
           // if we were ever authorized
           if (null != curr3lCredentials) {
              if (new Date(curr3lCredentials.expires_at - 300).getTime() > Date.now())
                 resolve({auth:oAuth2ThreeLegged, credentials:curr3lCredentials});
              else {
                 oAuth2ThreeLegged.refreshToken(curr3lCredentials).then(
                    function (credentials) {
                      curr3lCredentials = credentials;
                      resolve({auth:oAuth2ThreeLegged, credentials:curr3lCredentials});
                    },
                    function (err) {
                      reject(err);
                    }
                 );
              }
           }
           else
              reject({ statusMessage:'not authorized'});
        });
    },
}