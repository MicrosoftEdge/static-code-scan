// Original code from http://stackoverflow.com/questions/7268033/basic-static-file-server-in-nodejs

"use strict";

var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    port = 1338;
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

http.createServer(function(req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join(process.cwd(),'static', uri);
    fs.exists(filename, function(exists) {
        if(!exists) {
            console.error("not exists: " + filename);
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write('404 Not Found\n');
            res.end();
            return;
        }
        var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
        res.writeHead(200, {'Content-Type':mimeType});

        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(res);
    }); //end path.exists
}).listen(port);

module.exports.port = port;