/**
 * Description: Look for the presence of a tile meta tag for IE10 and Win8.
 * Note if a Retina icon for iOS devices has been specified so it can be reused.
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
    $ = require('cheerio'),
    request = require('request');

request = request.defaults({
    jar: false,
    headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        proxy: process.env.HTTP_PROXY || process.env.http_proxy,
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}
});

function checkMetatags(website) {
    var square70 = website.$('meta[name="msapplication-square70x70logo"]'),
        square150 = website.$('meta[name="msapplication-square150x150logo"]'),
        wide310 = website.$('meta[name="msapplication-wide310x150logo"]'),
        square310 = website.$('meta[name="msapplication-square310x310logo"]'),
        notifications = website.$('meta[name="msapplication-notification"]'),
        test = {
            testName: "ie11tiles",
            passed: false,
            data: {
                square70: false,
                square150: false,
                wide310: false,
                square310: false,
                notifications: false
            }
        };

    if (square70.length > 0) {
        test.passed = true;
        test.data.square70 = true;
    }

    if (square150.length > 0) {
        test.passed = true;
        test.data.square150 = true;
    }

    if (wide310.length > 0) {
        test.passed = true;
        test.data.wide310 = true;
    }

    if (square310.length > 0) {
        test.passed = true;
        test.data.square310 = true;
    }

    if (notifications.length > 0) {
        test.passed = true;
        test.data.notifications = true;
    }

    return test;
}


function checkConfigFile(website) {
    var deferred = new Deferred(),
        configTag = website.$('meta[name="msapplication-config"]'),
        test = {
            testName: "ie11tiles",
            passed: false,
            data: {
                square70: false,
                square150: false,
                wide310: false,
                square310: false,
                notifications: false
            }
        },
        url;

    if(configTag.length > 0){
        url = website.url.resolve($(configTag[0]).attr('content'));
    } else {
        url = website.url.resolve('browserconfig.xml');
    }

    request(url, function (error, response, body) {
        if (error) {
            deferred.resolve(test);
            return;
        }

        if (body.indexOf('square70x70') !== -1) {
            //passes the test and the square70x70 part
            test.passed = true;
            test.data.square70 = true;
        }

        if (body.indexOf('square150x150') !== -1) {
            //passes the test and the square150x150 part
            test.passed = true;
            test.data.square150 = true;
        }

        if (body.indexOf('wide310x150') !== -1) {
            //passes the test and the wide310x150 part
            test.passed = true;
            test.data.wide310 = true;
        }

        if (body.indexOf('square310x310') !== -1) {
            //passes the test and the square310x310 part
            test.passed = true;
            test.data.square310 = true;
        }

        if(body.indexOf('<notification>') !== -1){
            test.passed = true;
            test.data.notifications = true;
        }

        deferred.resolve(test);
        return;
    });


    return deferred.promise;
}

var check = function (website) {
    var deferred = new Deferred();

    process.nextTick(function () {
        var test = checkMetatags(website);

        if (test.passed) {

            deferred.resolve(test);
            return;
        }

        checkConfigFile(website)
            .then(function (result) {
                deferred.resolve(result);
            });
    });

    return deferred.promise;
};

module.exports.check = check;
