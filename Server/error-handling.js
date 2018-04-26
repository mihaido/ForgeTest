


module.exports = {
    returnErr : function (result, errorString) {
        result.writeHead(400);
     
        var error;
        if (null == errorString)
           error = '{\"statusMessage\":\"failed\"}';
        else
           error = '{\"statusMessage\":\"' + errorString + '\"}';
     
        result.end(error);
    },
     
     returnOk : function (result, data) {
        result.writeHead(200);
     
        var json;
        if (null != data)
           json = JSON.stringify(data);
        else
           json = null;
     
        result.end(json);
    }
}