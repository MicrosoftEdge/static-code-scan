/**
 * Description: Looks for the absence of the alt attribute in images.
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

var Deferred = require('promised-io').Deferred;

var check = function (website) {
    var deferred = new Deferred();

    process.nextTick(function () {
        var passed = true,
            images = website.$('img:not([alt]), img[alt=""]'),
            l = images.length,
            filtered = [];

        if (images.length > 0) {
            passed = false;
            for (var i = 0; i < l; i++) {
                var src = images[i].attribs.src;
                if (filtered.indexOf(src) === -1) {
                    filtered.push(images[i].attribs.src);
                }
            }
        }

        var test = {
            testName: "altImg",
            passed: passed,
            data: filtered
        };

        deferred.resolve(test);
    });

    return deferred.promise;
};

module.exports.check = check;