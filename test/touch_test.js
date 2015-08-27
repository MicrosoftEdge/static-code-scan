/**
 * Description: Test for detection of use of pointer events.
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

var touchChecker = require('../lib/checks/check-touch.js'),
    url = require('url'),
    cssloader = require('../lib/loadcss.js'),
    jsLoader = require('../lib/loadjs.js'),
    request = require('request'),
    cheerio = require('cheerio'),
    testServer = require('../static/test-server.js'),
    requester = require('../lib/requester.js'),
    testUrl = 'http://localhost:' + testServer.port + '/touch-';


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
                    .then(jsLoader.loadjsFiles)
                    .then(touchChecker.check)
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

module.exports['Touch tests'] = {
    'No Touch CSS': checkPage("1.html", {passed: false}),
    'No Touch in CSS': checkPage("2.html", {passed: false}),
    'ms-touch-action': checkPage("3.html", {passed: true}),
    'ms-touch-action embed': checkPage("4.html", {passed: true}),
    'msPointerEnabled': checkPage("5.html", {passed: true}),
    'msPointerEnabled embed': checkPage("6.html", {passed: true})
//    'No -ms-touch-action': checkPage("http://www.google.com", {passed: false}),
//    'Uses touch': checkPage("http://ie.microsoft.com/testdrive/Graphics/TouchEffects/", {passed: true}),
//    'Uses touch with an @import rule': checkPage("http://www.computer-service-goeppingen.de", {passed: true}),
//    'www.ietestdrive.com': checkPage("http://www.ietestdrive.com", {passed: true}),
//    'ie.microsoft.com/testdrive/Graphics/TouchEffects/': checkPage("http://ie.microsoft.com/testdrive/Graphics/TouchEffects/", {passed: true}),
//    'ie.microsoft.com/testdrive/Browser/BrowserSurface/': checkPage("http://ie.microsoft.com/testdrive/Browser/BrowserSurface/", {passed: true}),
//    'maps.bing.com': checkPage("http://maps.bing.com", {passed: true}),
//    'maps.google.com': checkPage("http://maps.google.com", {passed: true}),
//    't.msn.com': checkPage("http://t.msn.com", {passed: true}),
//    'www.craigslist.org': checkPage("http://www.craigslist.org", {passed: true}),
//    'www.reddit.com': checkPage("http://www.reddit.com", {passed: false}),
//    'www.microsoft.com': checkPage("http://www.microsoft.com", {passed: false}),
//    'www.windows.com': checkPage("http://www.windows.com", {passed: false})
};