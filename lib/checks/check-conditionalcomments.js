/**
 * Description: Looks for conditional comments that target all IE versions
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

var initiate = function (website) {
    var deferred = new Deferred();

    process.nextTick(function(){
        var test = {
            testName: "conditionalComments",
            passed: true,
            data: {}
        };



        var conditionalPosition = website.content.search(/<!--\[if ie\]>/gi);

        if(conditionalPosition !== -1){
            test.passed = false;
            test.data.lineNumber = website.content.substr(0, conditionalPosition).split('\n').length;
        }else {
            var targetsIE9 = website.content.search(/<!--\[if gte? ie [6-8]\]>/gi);
            if(targetsIE9 !== -1){
                test.passed = false;
                test.data.lineNumber = website.content.substr(0, targetsIE9).split('\n').length;
            }
        }

        deferred.resolve(test);
    });

    return deferred.promise;
};


module.exports.check = initiate;