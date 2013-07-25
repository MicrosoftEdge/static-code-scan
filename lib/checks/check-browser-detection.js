/**
 * Description: Checks if a website is using browser sniffing in its JavaScript.
 * To determine this we look for known patterns (like navigator.userAgent).
 * We only look for JavaScript files in the same domain that the website.
 * If a website www.domain.com embeds scripts from www.domain.com, script.domain.com
 * and ad.server.com, only those in www.domain.com will be analyzed.
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
    Promise = require('promised-io/promise'),
    request = require('request'),
    url = require('url'),
    rules = [
		"navigator.userAgent",
        "navigator.appVersion",
        "navigator.appName",
        "navigator.product",
        "navigator.vendor",
        "$.browser",
        "Browser."
	],
    exceptions = [
		"ajax.googleapis.com",
        "ajax.aspnetcdn.com",
        "ajax.microsoft.com",
        "jquery",
        "mootools",
        "prototype",
        "protoaculous"
	];

request = request.defaults({
    jar: false,
    headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}
});

function checkScript(url) {
    var deferred = new Deferred();
    //TODO: we should be using the predownloaded JS
    request(url, function (error, res, body) {
        // See if this script has any of our known libraries
        var scriptText = body || "",
            browserDetectionPassed = true,
            ruleIndex,
            lineNumber;
        if (error) {
            deferred.resolve({
                passed: false,
                pattern: 'Error parsing',
                lineNumber: -1,
                url: url
            });
        } else {
            for (var i = 0; i < rules.length; i++) {
                ruleIndex = scriptText.indexOf(rules[i]);
                if (ruleIndex !== -1) {
                    browserDetectionPassed = false;
                    lineNumber = scriptText.substr(0, ruleIndex).split('\n').length;
                    break;
                }
            }

            if (!browserDetectionPassed) {
                deferred.resolve({
                    passed: false,
                    pattern: rules[i],
                    lineNumber: lineNumber,
                    url: res.request.href
                });
            } else {
                deferred.resolve({
                    passed: true,
                    url: res.request.href
                });
            }
        }
    });
    return deferred;
}

var check = function (website) {
    var needsToBeProcessed = true;

    var scripts = website.$("script"),
        scriptPromises = [], src;

    for (var i = 0; i < scripts.length; i++) {
        src = scripts.eq(i).attr("src");
        needsToBeProcessed = true;
        //check if it is local, cdn or library
        if (src) {
            if (src.indexOf('http') === -1 && src.indexOf('//') === -1) {
                src = url.resolve(website.url, src);
                for (var j = 0; j < exceptions.length; j++) {
                    if (src.indexOf(exceptions[j]) !== -1) {
                        needsToBeProcessed = false;
                        break;
                    }
                }

                if (needsToBeProcessed) {
                    scriptPromises.push(checkScript(src));
                }
            }
        }
    }

    return Promise.all(scriptPromises).then(function (promises) {
        var test = {
            testName: "browserDetection",
            passed: true,
            data: []
        };

        for (var a = 0; a < promises.length; a++) {
            var pm = promises[a];
            if (!pm.passed) {
                test.passed = false;
            }
            test.data.push(pm);
        }

        return test;
    });
};

module.exports.check = check;