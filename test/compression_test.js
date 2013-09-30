/**
 * Description: Test that local scans can use authenticated (user/password) pages.
 * At the moment, only supports Basic and Digest auth courtesy of node.js request.
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

var service = require('../app.js'),
    serviceUrl = 'http://localhost:' + service.port + '/?url=%0',
    authServer = require('../static/compress-server.js'),
    serverUrl = 'http%3A%2F%2Flocalhost%3A' + authServer.port + '%2Fcompress-',
    request = require('request');


function checkObject(object, expected, test) {
    for (var key in expected) {
        if (typeof expected[key] === "object") {
            checkObject(object[key], expected[key], test);
        } else {
            test.equal(object[key], expected[key],  object[key] + " !== " + expected[key]);
        }
    }
}

function deepCount(object){
    var count = 0;
    if(typeof object === "object"){
        for(var key in object){
            count += deepCount(object[key]);
        }
    }else{
        count++;
    }
    return count;
}

function checkPage(page, expected, auth) {
    return function (test) {
        var uri = page.indexOf('http') === 0 ? page : serviceUrl.replace('%0', serverUrl + page),
            tests = deepCount(expected);

//       if (auth) {
//           uri += authString.replace('%1', auth.user).replace('%2', auth.password);
//       }

        test.expect(tests);

        request(uri, function (error, response, content) {
            var result = JSON.parse(content);
            checkObject(result, expected, test);
            test.done();
        });
    };
}

module.exports['Compression Tests'] = {
    'Compress': checkPage('1.html', {results: {compression: {passed: true}}})
};