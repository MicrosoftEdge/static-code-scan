/**
 * Description: Test the JavaScript library version detection.
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

var checklibs = require('../lib/checks/check-libs.js'),
    url = require('url'),
    request = require('request'),
    cheerio = require('cheerio'),
    jsloader = require('../lib/loadjs.js'),
    testServer = require('../static/test-server.js'),
    requester = require('../lib/requester.js'),
    testUrl = 'http://localhost:' + testServer.port + '/libs-';


function checkPage(page, test, expected) {
    var uri = testUrl + page,
        dataKeys = [],
        tests = 1;

    if (expected.data) {
        dataKeys = Object.keys(expected.data[0]);
        tests += dataKeys.length * expected.data.length;
    }

    test.expect(tests);

    request(uri, function (error, response, content) {
        var website = {
            url: url.parse(uri),
            content: content,
            request: requester(),
            $: cheerio.load(content)
        };

        jsloader.loadjsFiles(website)
            .then(checklibs.check)
            .then(function (result) {
                test.equal(result.passed, expected.passed, uri + " " + result.data.join("\n"));
                if (expected.data) {
                    for (var i = 0; i < expected.data.length; i++) {
                        for (var key in expected.data[i]) {
                            test.equal(result.data[i][key], expected.data[i][key], uri + " " + result.data[i][key]);
                        }
                    }
                }

                test.done();
            });
    });
}


module.exports['JS Libraries'] = {
    'jQuery - latest version': function (test) {
        checkPage('1.html', test, {
            passed: true
        });
    },
    'jQuery - 1.4.2': function (test) {
        checkPage('2.html', test, {
            passed: false,
            data: [
                {
                    lineNumber: 7,
                    version: "1.4.2",
                    minVersion: "1.6.4"
                }
            ]
        });
    },
    'dojo - latest version': function (test) {
        checkPage('3.html', test, {passed: true});
    },
    'dojo - v1.8.0': function (test) {
        checkPage('4.html', test, {
			passed: false,
            data: [
                {
                    lineNumber: 7,
                    version: "1.8.0",
                    minVersion: "1.8.5"
                }
            ]
		});
    },
    'jQuery UI - latest version': function (test) {
        checkPage('5.html', test, {passed: true});
    },
    'jQuery UI - v1.9.0': function (test) {
        checkPage('6.html', test, {
            passed: false,
            data: [
                {
                    lineNumber: 7,
                    version: "1.9.0",
                    minVersion: "1.9.2"
                }
            ]
        });
    },
    'jQuery UI - v1.9.0 min': function (test) {
        checkPage('7.html', test, {
            passed: false
        });
    },
    'jQuery & dojo up to date': function (test) {
        checkPage('8.html', test, {
            passed: true
        });
    },
    'jQuery up to date & dojo v 1.7.0': function (test) {
        checkPage('9.html', test, {
            passed: false,
            data: [
                {
                    lineNumber: 8,
                    version: "1.7.0",
                    minVersion: "1.7.5"
                }
            ]
        });
    },
    'jQuery 1.4.2 & dojo v 1.7.0': function (test) {
        checkPage('10.html', test, {
            passed: false,
            data: [
                {
                    lineNumber: 7,
                    version: "1.4.2",
                    minVersion: "1.6.4"
                },
                {
                    lineNumber: 8,
                    version: "1.7.0",
                    minVersion: "1.7.5"
                }
            ]
        });
    },
    'jQuery up to date 1.7': function (test) {
        checkPage('11.html', test, {
            passed: false,
            data: [
                {
                    lineNumber: 7,
                    version: "1.7",
                    minVersion: "1.7.2"
                }
            ]
        });
    },
    'jQuery up to date 1.12': function (test) {
        checkPage('13.html', test, {
            passed: true
        });
    },
    // Unit test for issue #97 (https://github.com/MicrosoftEdge/static-code-scan/issues/97)
    // Tests both compiled & minified version of Bootstrap 3.3.5 which previously caused a
    // false negative scan (detected as out dated jQuery)
    'Boostrap 3.3.5': function (test) {
        checkPage('12.html', test, {
            passed: true
        });
    }
};