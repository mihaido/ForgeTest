var express = require('express')
var app = express()

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


app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/test', function (req, res) {
  oAuth2TwoLegged.authenticate().then(
    function(credentials){
      res.send('Successfully authenticated!')
    },
    function (error){
      res.send('Authentication failed: ' + error['more info']);
    });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
