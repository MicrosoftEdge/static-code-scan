/**
 * Description: Tests for conditional comments that target all IE versions
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

var conditional = require('../lib/checks/check-browser-detection.js'),
    url = require('url'),
    request = require('request'),
    cheerio = require('cheerio'),
    testServer = require('../static/test-server.js'),
    testUrl = 'http://localhost:' + testServer.port + '/conditional-';


function recursiveCheck(expected, result, test){
    for(var key in expected){
        if(typeof expected[key] === 'object'){
            recursiveCheck(expected[key], result[key], test);
        }else{
            test.equal(result[key], expected[key], "key: " + result[key] + " !== " + expected[key]);
        }
    }
}

function testCount(expected){
    var count = 0;
    for(var key in expected){
        if(typeof expected[key] === 'object'){
            count += testCount(expected[key]);
        }else{
            count++;
        }
    }
    return count;
}

function checkPage(page, expected) {
        return function (test) {
        var uri = page.indexOf('http') === 0 ? page : testUrl + page,
            tests = 1;

        if (expected.data) {
            tests += testCount(expected.data);
        }

        test.expect(tests);

        request(uri, function (error, response, content) {
            var website = {
                url: url.parse(uri),
                content: content,
                js: [],
                $: cheerio.load(content)
            };

            conditional.check(website).then(function (result) {
                test.equal(result.passed, expected.passed, uri + " passed: " + result.passed + " !== " + expected.passed);
                if (expected.data) {
                    recursiveCheck(expected.data, result.data, test);
                }
                test.done();
            });
        });
    };
}

module.exports['Conditional Comments'] = {
    'No conditional comments': checkPage('1.html', {
        passed: true
    }),
    'if IE': checkPage('2.html', {
        passed: false,
        data: {
            comments: {
                passed:false,
                data: {
                    lineNumber: 6
                }
            }
        }
    }),
    'if IE 6': checkPage('3.html', {
        passed: true
    }),
    'if IE 7': checkPage('4.html', {
        passed: true
    }),
    'if IE 8': checkPage('5.html', {
        passed: true
    }),
    'if IE9': checkPage('6.html', {
        passed: true
    }),
    'if gte IE 8': checkPage('7.html', {
        passed: false,
        data: {
            comments: {
                passed:false,
                data: {
                    lineNumber: 6
                }
            }
        }
    }),
    'if gte IE 6': checkPage('8.html', {
        passed: false,
        data: {
            comments: {
                passed:false,
                data: {
                    lineNumber: 6
                }
            }
        }
    })
};