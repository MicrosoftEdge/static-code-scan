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

function htmlEncode(encodedHtml) {
    if (typeof encodedHtml === 'undefined') {
        return;
    }
    return encodedHtml.replace(/\//g, "%2F")
        .replace(/\?/g, "%3F")
        .replace(/\=/g, "%3D")
        .replace(/&/g, "%26")
        .replace(/@/g, "%40")
        .replace(/</g, "")
        .replace(/>/g, "");
}

function checkPrefixes(list, matcher, prefixMap, selector, add) {
	var prefixList = {},
		problems = [];
	
	for ( var i = 0; i < list.length; i++ ) {
		var item = list[i],
			match = matcher.exec(item) || [],
			unprefixed = match[2],
			prefixesLeft = prefixList[unprefixed],
			prefixesNeeded = prefixMap[unprefixed] || match[3] && prefixMap[match[3]];
		
		if ( prefixesNeeded ) {
			// We want to track prefixing for this property
			if ( prefixesLeft === undefined ) {
				// First time we've seen this property in the rule
				prefixesLeft = prefixList[unprefixed] = prefixesNeeded + " " + unprefixed;
			}
			// Remove this prefix (or unprefixed value) if it is a required one
			prefixList[unprefixed] = prefixesLeft.replace(new RegExp(match[1] || "\\b" + unprefixed + "\\b"), "");
		}
	}
	// See if any rules are missing prefixed equivalents or vice-versa
	for ( var p in prefixList ) {
		// Use the full prefixed property name for reporting
		// e.g. in: " -ms-  transform", out: "-ms-transform transform"
		var needed = prefixList[p].replace(/-(\s|$)/g, "-" + p + " ").trim().replace(/\s+/g, " ");

		if ( needed ) {
			add(selector, needed);
		}
	}
	return problems;
}

function checkRules(css) {
	var rules = css.css.cssRules,
		report = {
			cssFile: css.cssUrl,
			selectors: []
		},
		start = 0,
		// Function to add a problem report for this rule
		addProblem = function(selector, missing) {
			report.selectors.push({
				selector: htmlEncode(selector),
				styles: missing.split(" "),
				lineNumber: css.cssBody.substr(0, start).split('\n').length
			});
		};

	// Process each rule in the sheet: `selectors { prop: expr; ... }`
	for ( var r=0; r < rules.length; r++ ) {
		// CSSStyleDeclaration
		var decls = rules[r].style || [];
	
		// Set the starting character point for this declaration in the sheet
		start = decls.__starts || 1;

		// Check for prefixes on all the properties
		checkPrefixes(
			decls,
			vendorPrefixMatcher,
			prefixedPropMap,
			rules[r].selectorText,
			addProblem
		);

		// Check for prefixes on expressions in non-prefixed properties; see loadcss.js for
		// details on how we are saving duplicate declarations using ~prop.
		for ( var p = 0; p < decls.length; p++ ) {
			var prop = decls[p];
			if ( !/^-/.test(prop) ) {
				checkPrefixes(
					decls["~"+prop] || [ decls[prop] || "" ],
					vendorPrefixMatcher,
					prefixedExprMap,
					rules[r].selectorText,
					addProblem
				);
			}
		}
	}
	return report;
}

function check(website) {
    var deferred = new Deferred();

	// Let the main loop run before we do this work
	setImmediate(function() {
		var test = {
				testName: "cssprefixes",
				passed: true,
				data: []
			};

		for ( var i = 0; i < website.css.length; i++ ) {
			var result = checkRules(website.css[i]);
			if ( result.selectors.length ) {
				test.passed = false;
				test.data.push(result);
			}
		}

		deferred.resolve(test);
	});

    return deferred.promise;
}

module.exports.check = check;