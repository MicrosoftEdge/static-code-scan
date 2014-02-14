/**
 * Description: Validates the HTML validity using the W3C HTML Validator (http://validator.w3.org/)
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

var Deferred = require('promised-io').Deferred,
    request = require('request'),
    w3cCheckUrl = 'http://validator.w3.org/check',
    defaultOutput = 'json',
    timeout = 15000; //15 secs of time to get an answer from W3C

request = request.defaults({
    jar: false,
    proxy: process.env.HTTP_PROXY || process.env.http_proxy,
    headers: {
        'User-Agent': 'Modern.ie - Code Scanner'}});

var check = function (website) {
    var deferred = new Deferred();
    var resolved = false;
    var timeoutId = setTimeout(function () {
        resolved = true;

        var result = {
            testName: "w3c-validator",
            passed: false,
            data: ['Timeout']
        };

        deferred.resolve(result);

    }, timeout);

    var url = w3cCheckUrl + '?output=' + defaultOutput + '&uri=' + encodeURIComponent(website.url.href);

    request.get(url, function (err, res, body) {
            var result;
            clearTimeout(timeoutId);

            if (resolved) {
                return;
            }

            if (err) {
                result = {
                    testName: "w3c-validator",
                    passed: false,
                    data: ['Error']
                };
                deferred.resolve(result);
                return;
            }

            try {
                var content = JSON.parse(body);

                result = {
                    testName: "w3c-validator",
                    passed: content.messages.length === 0,
                    data: content.messages
                };
            } catch (e) {
                result = {
                    testName: "w3c-validator",
                    passed: false,
                    data: ['Remote error']
                };
            } finally {
                deferred.resolve(result);
            }
        });


    return deferred.promise;
};

module.exports.check = check;
module.exports.parallel = true;