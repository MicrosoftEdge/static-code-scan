/**
 * Description: Load the external JavaScript files and embedded script blocks to make
 * them available for further analysis. Files added dynamically are not analyzed.
 *
 * Copyright (c) Microsoft Corporation; All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS
 * OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
 *
 * See the Apache Version 2.0 License for specific language governing permissions
 * and limitations under the License.
 */

"use strict";

var request = require('request'),
    promised = require("promised-io/promise"),
    Deferred = require('promised-io').Deferred,
    url = require('url');

request = request.defaults({
    jar: false,
    headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}});

function downloadJS(jsUrl, jsHref, auth) {
    var jsDeferred = new Deferred(),
        parameters = {uri: jsUrl,
            headers: {
                'Accept': 'text/html, application/xhtml+xml, */*'}};

    if (auth) {
        parameters.auth = auth;
    }

    request(parameters, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            response.on('error', function (e) {
                console.log('loading CSS' + e);
            });
            jsDeferred.resolve({url: url, jsUrl: jsHref, finalUrl: response.request.href, content: body});
        } else {
            jsDeferred.resolve({});
        }
    });

    return jsDeferred.promise;
}

function check(website) {
    var deferred = new Deferred(),
        jsLinks = website.$('script'),
        js = [],
        jsPromises = [];

    website.js = [];

    for (var i = 0; i < jsLinks.length; i++) {
        var jsHref = jsLinks[i].attribs.src,
            jsUrl;

        if (jsHref) {
            if (jsHref) {
                jsUrl = url.resolve(website.url, jsHref);
                jsPromises.push(downloadJS(jsUrl, jsHref, website.auth));
            }
        } else if (jsLinks[i].children[0] && jsLinks[i].children[0].data) {
            // Some <script> tags that do not contain anything. We ignore those
            js.push({jsUrl: 'embed', content: jsLinks[i].children[0].data});
        }
    }

    if (jsPromises.length > 0) {
        promised.all(jsPromises).then(function (array) {
            for (i = 0; i < array.length; i++) {
                if (array[i].finalUrl) {
                    js.push(array[i]);
                }
            }

            website.js = js;

            deferred.resolve(website);
        }, function () {
            deferred.reject();
        });
    } else {
        // There aren't any external JS but we could have embedded JS
        process.nextTick(function(){
            website.js = js;
            deferred.resolve(website);
        });
    }

    return deferred.promise;
}

module.exports.loadjsFiles = check;