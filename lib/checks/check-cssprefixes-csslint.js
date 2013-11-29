/**
 * Description: This check looks for any missing vendor prefix (-webkit-, -moz-, -o-, -ms-) for the following CSS rules:
 * transform, animation, transition-property, transition-duration, transition-timing-function, transition-delay, transition,
 * linear-gradient, radial-gradient, gradient
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

// NB: PropMap/ExprMap information from caniuse.com

var Deferred = require('promised-io').Deferred,
    csslintId1 = 'compatible-vendor-prefixes',
	vendorPrefixMatcher = /^(-\w+-)?((\w+)[\w\-]*)/,
	// Properties may have following `-terms` (e.g., transition-delay)
	prefixedPropMap = {
		"animation": "-webkit-",
		"perspective": "-ms- -webkit-",
		"transform": "-ms- -webkit-",
		"transition": "-webkit-"
	},
	// Expression terms are the entire name with optional prefix
    prefixedExprMap = {
		"linear-gradient":  "-webkit-",
		"radial-gradient":  "-webkit-"
	};


function check(website) {
    var deferred = new Deferred();

	// Let the main loop run before we do this work
	process.nextTick(function() {
		var test = {
				testName: "csslintprefixes",
				passed: true,
				data: []
			};

        website.css.forEach(function(cssFile){
            var report = cssFile.report;
            var messages = report.messages;
            var apply = messages.filter(function(message){
                return message.rule.id === csslintId1;
            });
            console.log(apply);
        });

	    website.css.report;

		deferred.resolve(test);
	});

    return deferred.promise;
}

module.exports.check = check;