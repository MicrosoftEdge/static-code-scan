/**
 * Description: Test the CSS prefix completeness detection.
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

var cssprefixes = require('../lib/checks/check-cssprefixes.js'),
    url = require('url'),
    cssloader = require('../lib/loadcss.js'),
    request = require('request'),
    cheerio = require('cheerio'),
    testServer = require('../static/test-server.js'),
    requester = require('../lib/requester.js'),
    testUrl = 'http://localhost:' + testServer.port + '/cssprefixes-';


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
                    .then(cssprefixes.check)
                    .then(function (result) {
                        test.equal(result.passed, expected.passed, uri + " passed: " + result.passed + " !== " + expected.passed);

                        if (expected.data) {
                            for (var key in expected.data) {
                                test.strictEqual(result.data[key], expected.data[key], uri + " " + key + " " + result.data[key] + " !== " + expected.data[key]);
                            }
                        }
                        test.done();
                    });
            });
    };
}

module.exports['CSS Prefixes'] = {
    'No CSS': checkPage("1.html", {passed: true}),
    'Simple CSS with no CSS3': checkPage("2.html", {passed: true}),
    'Unprefixed version of rules': checkPage("3.html", {passed: false}),
    'Simple CSS + Unprefixed version': checkPage("4.html", {passed: false}),
    'Transform': checkPage("5.html", {passed: true}),
    'Transitions': checkPage("6.html", {passed: true}),
    'Gradients': checkPage("7.html", {passed: true}),
    'Animations': checkPage("8.html", {passed: true}),
    'Missing Transform': checkPage("9.html", {passed: false}),
    'Missing Transitions': checkPage("10.html", {passed: false}),
    'Missing Gradients': checkPage("11.html", {passed: false}),
    'Missing Animations': checkPage("12.html", {passed: false}),
    'Gradients + Transforms': checkPage("13.html", {passed: true}),
    'Gradients + Missing Transforms': checkPage("14.html", {passed: false}),
    'Embed Transform': checkPage("15.html", {passed: true}),
    'Embed Missing Transform': checkPage("16.html", {passed: false}),
    'Imports using url(), inline': checkPage("17.html", {passed: false}),
    'Imports using single, included': checkPage("18.html", {passed: false}),
    'Imports using quoted url(), included': checkPage("19.html", {passed: false}),
    'Cycle import': checkPage("20.html", {passed: false})
};