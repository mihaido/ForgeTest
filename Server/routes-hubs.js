
var ForgeSDK = require('forge-apis');
var HubsAPI = new ForgeSDK.HubsApi();
var ProjectsAPI = new ForgeSDK.ProjectsApi();
var FoldersAPI = new ForgeSDK.FoldersApi();

var AuthUser = require('./auth-3-leg.js');
var ErrHand = require('./error-handling.js');

module.exports = function(app){

    app.get('/getHubs', function (req, res) {
        AuthUser.ensureValidToken().then(
          function(authInfo){
            HubsAPI.getHubs({}, authInfo.auth, authInfo.credentials).then(
            function (hubs) {
                ErrHand.returnOk(res, hubs);
            },
            function (err) {
                ErrHand.returnErr(res, err.statusMessage);
            });
          },
          function (error){
            ErrHand.returnErr(res, 'User authentication failed: ' + error['more info']);
          });
      });

    app.get('/getHubProjects', function (req, res) {
    
        res.setHeader('Content-Type', 'application/json');
    
        var id = req.query.id;
    
        AuthUser.ensureValidToken().then( 
            function (authInfo) {
                ProjectsAPI.getHubProjects(id, null, authInfo.auth, authInfo.credentials).then(
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

    app.get('/getProjectContents', function (req, res) {
    
        res.setHeader('Content-Type', 'application/json');
    
        var hubId = req.query.hubId;
        var projId = req.query.projId;
    
        AuthUser.ensureValidToken().then( 
            function (authInfo) {
                ProjectsAPI.getProjectTopFolders(hubId, projId, authInfo.auth, authInfo.credentials).then(
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
    
    app.get('/getFolderContents', function (req, res) {
    
        res.setHeader('Content-Type', 'application/json');
    
        var projId = req.query.projId;
        var foldId = req.query.foldId;
    
        AuthUser.ensureValidToken().then( 
            function (authInfo) {
                FoldersAPI.getFolderContents(projId, foldId, null, authInfo.auth, authInfo.credentials).then(
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
}