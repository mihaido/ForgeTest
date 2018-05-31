
var ForgeSDK = require('forge-apis');
var Secret = require('./secret.js');

var autoRefresh = true; // or false

//
// addresses need to match (from domain point of view) otherwise we loose the cookies
var baseServerAddress = 'http://bucs4bu0930.ads.autodesk.com:3000';
var REDIRECT_URL = 'http://bucs4bu0930.ads.autodesk.com:3000/auth3l';

var oAuth2 = new ForgeSDK.AuthClientThreeLegged(Secret.CLIENT_ID, Secret.CLIENT_SECRET, 
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

//var curr3lCredentials; stop using this, move to use the cookie instead

var authContinueUrl = baseServerAddress;

var ensureValidToken = function (credentials) {
    return new Promise(function (resolve, reject) {
       //
       // if we were ever authorized
       if (null != credentials) {
          if (new Date(credentials.expires_at - 300).getTime() > Date.now())
             resolve(credentials);
          else {
            oAuth2.refreshToken(credentials).then(
                function (newCredentials) {
                  //credentials = newCredentials;
                  resolve(credentials);
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
}

var getPostAuthRedirect = function(res){
    if(res.cookies){
        currRedirectRequest = res.cookies['postAuthRedirect'];
        if(currRedirectRequest){
            return currRedirectRequest;
        }
        else
            return authContinueUrl;
    }
    else
        return authContinueUrl;
}

module.exports = {

    authContinueUrl,
    
    oAuth2,

    ensureValidToken,

    getPostAuthRedirect,

    setupCredentials : function(authorizationCode, res, state){
        oAuth2.getToken(authorizationCode).then(
        function (credentials) {
            
            res.cookie('credentials', credentials);
            //var redirectAddr = getPostAuthRedirect(res);
            if(state){
                res.writeHead(301, { Location: state });
            }
            
            res.end();
        },
        function (error) {
        });
    },

    generateAuthUrl : function(state) {
        return oAuth2.generateAuthUrl(state);
    },

    getAndRefreshCredentials : function(req, res){
        return new Promise(function (resolve, reject) {
            if(!req.cookies)
                reject({ statusMessage:'invalid credentials'});
            else{
                currCredentials = req.cookies['credentials'];
                
                if(currCredentials){
                    if (new Date(currCredentials.expires_at).getTime() - 1000 < Date.now()){
                        ensureValidToken(currCredentials).then(
                            function(credentials){
                                res.cookie('credentials', credentials);
                                resolve(credentials);
                            },
                            function(error){
                                reject(error);
                            }
                        )
                    }
                    else
                        resolve(currCredentials);
                }
                else
                    reject({ statusMessage:'invalid credentials'});
            }
        });
    },
}