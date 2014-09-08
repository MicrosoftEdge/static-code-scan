/**
 * Description: Test the X-UA-Compatible and CV-list detection.
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

var compatList = require('../lib/checks/check-compatlist.js'),
    url = require('url'),
    request = require('request'),
    cheerio = require('cheerio'),
    testServer = require('../static/test-server.js'),
    testUrl = 'http://localhost:' + testServer.port + '/compat-';

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
                $: cheerio.load(content)
            };

            compatList.check(website).then(function (result) {
                test.equal(result.passed, expected.passed, url + " " + result.passed + " !==" + expected.passed);
                if (expected.data) {
                    for (var key in expected.data) {
                        test.equal(result.data[key], expected.data[key], uri + " " + result.data[key] + " !== " + expected.data[key]);
                    }
                }
                test.done();
            });
        });
    };
}


module.exports['Compatibility List'] = {
    'www.modern.ie - Not CV list': checkPage('http://www.modern.ie', {passed: true}),
    'Present (auction.co.kr)': checkPage('http://auction.co.kr', {passed: false,
        data: {
            source: 'cvlist',
            mode: 'EmulateIE7'
        }
    }),
    'Website in cvlist but only for Flash (on24.com)': checkPage('http://on24.com', {passed: true}),
    'No metatag': checkPage('1.html', {passed: true}),
    'IE=5': checkPage('2.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=5'
        }}),
    'IE=EmulateIE7': checkPage('3.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=emulateie7'
        }}),
    'IE=7': checkPage('4.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=7'
        }}),
    'IE=EmulateIE8': checkPage('5.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=emulateie8'
        }}),
    'IE=8': checkPage('6.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=8'
        }}),
    'IE=EmulateIE9': checkPage('7.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=emulateie9'
        }}),
    'IE=9': checkPage('8.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=9'
        }}),
    'IE=edge': checkPage('9.html', {passed: true}),
    'IE=8,edge': checkPage('10.html', {passed: true}),
    'IE=EmulateIE9,edge': checkPage('11.html', {passed: true}),
    'IE=chrome=1': checkPage('12.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=chrome=1'
        }}),
    'IE=EmulateIE10': checkPage('13.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=emulateie10'
        }}),
    'IE=EmulateIE8 lowercase': checkPage('14.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=emulateie8'
        }}),
    'IE=EmulateIE8 bizarre case': checkPage('15.html', {passed: false,
        data: {
            source: 'tag',
            mode: 'ie=emulateie8'
        }}),
    'IE=edge bizarre case': checkPage('16.html', {passed: true})
};