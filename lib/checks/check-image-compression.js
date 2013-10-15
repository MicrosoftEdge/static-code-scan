/**
 * Description: Checks if the images in the current website are compressed enough
 * or there can be more bandwidth savings.
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
    request = require('request').defaults({jar: false}),
    endPoint = 'https://api.kraken.io/modernie',
    config = require('./config.js');


var check = function (website) {
    var deferred = new Deferred();

    var url = website.url.href,
        result = {
            testName: 'imageCompression',
            passed: false

        };

    request.post(endPoint,
        {form: {
            key: config.kraken_key,
            secret: config.kraken_secret,
            url: url}
        }, function (error, response, body) {
            if (error) {
                deferred.resolve(result);
                return;
            }

            var content = JSON.parse(body);

            if (content.success) {
                if (content.meta.total_savings !== 0) {
                    result.data = content.meta;
                }else{
                    result.passed = true;
                }
            }

            deferred.resolve(result);
        });


    return deferred.promise;
};

module.exports.check = check;
module.exports.parallel = true;