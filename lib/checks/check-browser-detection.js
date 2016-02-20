/**
 * Description: Checks if a website is using browser sniffing in its JavaScript.
 * To determine this we look for known patterns (like navigator.userAgent).
 * We only look for JavaScript files in the same domain that the website.
 * If a website www.domain.com embeds scripts from www.domain.com, script.domain.com
 * and ad.server.com, only those in www.domain.com will be analyzed.
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

'use strict';

var bluebird = require('bluebird'),
	rules = [
		'navigator.userAgent',
		'navigator.appVersion',
		'navigator.appName',
		'navigator.product',
		'navigator.vendor',
		'$.browser',
		'Browser.'
	],
	exceptions = [
		'ajax.googleapis.com',
		'ajax.aspnetcdn.com',
		'ajax.microsoft.com',
		'jquery',
		'mootools',
		'prototype',
		'protoaculous'
	];

var checkScript = bluebird.method(function (script) {
	// See if this script has any of our known libraries
	var scriptText = script.content || '',
		browserDetectionPassed = true,
		ruleIndex,
		lineNumber;

	for (var i = 0; i < rules.length; i++) {
		ruleIndex = scriptText.indexOf(rules[i]);
		if (ruleIndex !== -1) {
			browserDetectionPassed = false;
			lineNumber = scriptText.substr(0, ruleIndex).split('\n').length;
			break;
		}
	}

	if (!browserDetectionPassed) {
		return {
			passed: false,
			pattern: rules[i],
			lineNumber: lineNumber,
			url: script.jsUrl
		};
	} else {
		return {
			passed: true,
			url: script.jsUrl
		};
	}
});

var checkConditionalComments = function (website) {
	var test = {
		passed: true
	};

	var conditionalPosition = website.content.search(/<!--\[if ie\]>/gi);

	if (conditionalPosition !== -1) {
		test.passed = false;
		test.data = {
			lineNumber: website.content.substr(0, conditionalPosition).split('\n').length
		};
	} else {
		var targetsIE9 = website.content.search(/<!--\[if gte? ie [6-8]\]>/gi);
		if (targetsIE9 !== -1) {
			test.passed = false;
			test.data = {
				lineNumber: website.content.substr(0, targetsIE9).split('\n').length
			};
		}
	}

	return test;
};

var check = function (website) {
	var needsToBeProcessed = true;

	var scripts = website.js,
		scriptPromises = [], src;

	for (var i = 0; i < scripts.length; i++) {
		src = scripts[i];
		needsToBeProcessed = true;

		if (!src.jsUrl && src.url) {
			src.jsUrl = src.url;
		}

		//If script is in a different domain chances are it is for ads or analytics. We should improve this heuristic sometime
		if (src.jsUrl !== 'embed' && website.url.resolve(src.jsUrl).indexOf(website.url.host) === -1) {
			needsToBeProcessed = false;
		}

		for (var j = 0; j < exceptions.length && src.jsUrl !== 'embed' && needsToBeProcessed; j++) {
			if (src.jsUrl.indexOf(exceptions[j]) !== -1) {
				needsToBeProcessed = false;
				break;
			}
		}

		if (needsToBeProcessed) {
			scriptPromises.push(checkScript(src));
		}
	}

	return bluebird.all(scriptPromises).then(function (promises) {
		var browserTest = {
			passed: true,
			data: []
		};

		for (var a = 0; a < promises.length; a++) {
			var pm = promises[a];
			if (!pm.passed) {
				browserTest.passed = false;
				browserTest.data.push(pm);
			}
		}

		var conditionalTest = checkConditionalComments(website);

		var test = {
			testName: 'browserDetection',
			passed: browserTest.passed && conditionalTest.passed,
			data: {
				javascript: browserTest,
				comments: conditionalTest
			}
		};

		return test;
	})
		.catch(function (err) {
			console.log(err);
		});
};

module.exports.check = check;
