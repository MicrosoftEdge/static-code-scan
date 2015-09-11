/**
 * Description: Test the detection of plugins.
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

var pluginChecker = require('../lib/checks/check-pluginfree.js'),
    request = require('request'),
    cheerio = require('cheerio'),
    url = require('url'),
    testServer = require('../static/test-server.js'),
    requester = require('../lib/requester.js'),
    testUrl = 'http://localhost:' + testServer.port + '/plugin-';


function checkPage(page, expected) {
    return function (test) {
        var uri = page.indexOf('http') === 0 ? page : testUrl + page,
            tests = 1;

        if (expected.data) {
            tests += Object.keys(expected.data).length;
        }

        test.expect(tests);

        request(uri, function (error, response, content) {
            var website = {
                url: url.parse(uri),
                content: content,
                request: requester(),
                $: cheerio.load(content, { lowerCaseTags: true, lowerCaseAttributeNames: true })
            };

            pluginChecker.check(website).then(function (result) {
                test.equal(result.passed, expected.passed, uri + " passed: " + result.passed + " !== " + expected.passed);
                if (expected.data) {
                    for (var key in expected.data) {
                        test.strictEqual(result.data[key], expected.data[key], uri + " " +key + " " + result.data[key] + " !== " + expected.data[key]);
                    }
                }
                test.done();
            });
        });
    };
}

module.exports['Plugin Free'] = {
    'No plugin - No CV list': checkPage('1.html', {passed: true}),
    'Flash embed tag': checkPage('2.html', {passed: true}),
    'Flash object tag': checkPage('3.html', {passed: true}),
    'Flash object tag with param': checkPage('4.html', {passed: true}),
    'Flash with nested objects': checkPage('5.html', {passed: true}),
    'Flash with object and embed': checkPage('6.html', {passed: true}),
    'ActiveX control': checkPage('7.html', {passed: false,
        data: {
            activex: true,
            cvlist: false,
            lineNumber: 10
        }}),
    'Active Content with object tag (no SWF)': checkPage('8.html', {passed: false,
        data: {
            activex: true,
            cvlist: false,
            lineNumber: 10
        }}),
    'Embed SVG': checkPage('9.html', {passed: true}),
    'Object SVG': checkPage('10.html', {passed: true}),
    'SVG + Flash': checkPage('11.html', {passed: true}),
    'SVG + ActiveX': checkPage('12.html', {passed: false,
        data: {
            activex: true,
            cvlist: false,
            lineNumber: 11
        }
    }),
    /*
     * REMOVED BY M-GAGNE
     * aardman.com no longer in CV List
     * this test is fragile as the CV List changes     
    'Blocked website in CV List': checkPage('http://aardman.com',{passed:false,
    data:{
        activex: false,
        cvlist: true
    }}),
    */
    'Embed tag with SVG instead flash ( http://doulosdiscovery.org)': checkPage('http://doulosdiscovery.org', {passed: true})
};