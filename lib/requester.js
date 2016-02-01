'use strict';

var request = require('request'),
    //httpntlm = require('httpntlm'),
    http = require('http'),
    bluebird = require('bluebird');

//var internalRequest = request.defaults({
//    jar: false,
//    proxy: process.env.HTTP_PROXY || process.env.http_proxy,
//    headers: {
//        'Accept-Language': 'en-US,en;q=0.5',
//        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'
//    }
//});
//
//var authInfos = {
//    type: "none",
//    username: "",
//    password: "",
//    domain: "",
//};

// ## HTTP Headers lowercase error
//
// see: http://stackoverflow.com/questions/20643699/how-do-i-send-uppercase-headers-in-http
var automaticHeaders = {
    connection: true,
    'content-length': true,
    'transfer-encoding': true,
    date: true
};
http.OutgoingMessage.prototype.setHeader = function (name, value) {
    if (arguments.length < 2) {
        throw new Error('`name` and `value` are required for setHeader().');
    }

    if (this._header) {
        throw new Error('Can\'t set headers after they are sent.');
    }

    // NO LOWER CASE
    var key = name;//.toLowerCase();
    this._headers = this._headers || {};
    this._headerNames = this._headerNames || {};
    this._headers[key] = value;
    this._headerNames[key] = name;

    if (automaticHeaders[key]) {
        if (this._removedHeader) {
            this._removedHeader[key] = false;
        }
    }
};


module.exports = function(auth){
    if(!auth || auth.type !== 'ntlm') {
        var defaultRequest = request.defaults({
            followAllRedirects: true,
            encoding: null,
            auth: auth,
			gzip: true,
            jar: false,
            proxy: process.env.HTTP_PROXY || process.env.http_proxy,
            headers: {
                'Accept': 'text/html, application/xhtml+xml, */*',
                'Accept-Encoding': 'gzip,deflate',
                'Accept-Language': 'en-US,en;q=0.5',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko' /* Set IE11 UA */
            }
        });

        return bluebird.promisifyAll(defaultRequest);
    }
};

// exports.authInfos = authInfos;
// exports.defaultRequest = defaultRequest;
// exports.internalRequest = internalRequest;