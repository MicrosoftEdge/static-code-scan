/**
 * Description: Test the detection of Responsive Web Design (width/height breakpoints).
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

var responsive = require('../lib/checks/check-responsive.js'),
    url = require('url'),
    cssloader = require('../lib/loadcss.js'),
    request = require('request'),
    cheerio = require('cheerio'),
    testServer = require('../static/test-server.js'),
    requester = require('../lib/requester.js'),
    testUrl = 'http://localhost:' + testServer.port + '/rwd-';


function checkPage(page, expected) {
    return function (test) {
        var uri = page.indexOf('http') === 0 ? page : testUrl + page,
            tests = 1;

        if (expected.data) {
            tests += Object.keys(expected.data).length;
        }

        test.expect(tests);

        request({uri: uri,
                headers: {'user-agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}},
            function (error, response, content) {
                var website = {
                    url: url.parse(uri),
                    content: content,
                    request: requester(),
                    $: cheerio.load(content)
                };

                cssloader.loadCssFiles(website)
                    .then(responsive.check)
                    .then(function (result) {
                        test.equal(result.passed, expected.passed, uri + " passed: " + result.passed + " !== " + expected.passed);

                        if (expected.data) {
                            for (var key in expected.data) {
                                test.deepEqual(result.data[key], expected.data[key], uri + " " + key + " " + result.data[key] + " !== " + expected.data[key]);
                            }
                        }

                        test.done();
                    });
            });
    };
}

module.exports['Responsive'] = {
    'No CSS - No RWD': checkPage("1.html", {passed: false}),
    'Simple CSS - No RWD': checkPage("2.html", {passed: false}),
    'RWD - min-width': checkPage("3.html", {passed: true, data: {
        minBreakPoints: [480],
        maxBreakPoints: []
    }}),
    'RWD - max-width': checkPage("4.html", {passed: true, data: {
        minBreakPoints: [],
        maxBreakPoints: [480]
    }}),
    'RWD - min and max width': checkPage("5.html", {passed: true, data: {
        minBreakPoints: [480, 780],
        maxBreakPoints: [479]
    }}),
    'RWD - min and max width with different order': checkPage("6.html", {passed: true, data: {
        minBreakPoints: [480, 780],
        maxBreakPoints: [479]
    }}),
    'RWD - Duplicate widths': checkPage("7.html", {passed: true, data: {
        minBreakPoints: [480, 780],
        maxBreakPoints: [479]
    }}),
    'RWD - Several CSS files': checkPage("8.html", {passed: true, data: {
        minBreakPoints: [480],
        maxBreakPoints: [480]
    }}),
    'RWD - Embedded CSS': checkPage("9.html", {passed: true, data: {
        minBreakPoints: [480],
        maxBreakPoints: [479]
    }}),
    'RWD - min max width with EM': checkPage("10.html", {passed: true, data: {
        minBreakPoints: [480, 780],
        maxBreakPoints: [480]
    }}),
    'RWD - min BreakPoints Spectrum': checkPage("11.html", {passed: true, data: {
        minBreakPoints: [360, 440, 720],
        maxBreakPoints: [],
        spectrum: [
            {start: 360, end: 550},
            {start: 720, end: 900}
        ]
    }}),
    'RWD - max BreakPoints Spectrum': checkPage("12.html", {passed: true, data: {
        minBreakPoints: [],
        maxBreakPoints: [360, 440, 720],
        spectrum: [
            {start: 270, end: 440},
            {start: 540, end: 720}
        ]
    }}),
    'RWD - min and max BreakPoints Spectrum': checkPage("13.html", {passed: true, data: {
        minBreakPoints: [360, 440, 720],
        maxBreakPoints: [360, 440, 720],
        spectrum: [
            {start: 270, end: 900}
        ]
    }}),
    'RWD - min and max BreakPoints Spectrum 2': checkPage("14.html", {passed: true, data: {
        minBreakPoints: [100, 550, 1120],
        maxBreakPoints: [360, 440, 720],
        spectrum: [
            {start: 100, end: 125},
            {start: 270, end: 440},
            {start: 540, end: 720},
            {start: 1120, end: 1400}
        ]
    }})
};