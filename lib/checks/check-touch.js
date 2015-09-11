/**
 * Description: Look for known patterns of use for the Pointers API in CSS and JS files.
 * (Keep in mind that files added dynamically are not analyzed.)
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
	cssRules = ['-ms-touch-action',
		'-ms-scroll-snap-points-x',
		'-ms-scroll-snap-points-y',
		'-ms-scroll-snap-type',
		'-ms-scroll-snap-x',
		'-ms-scroll-snap-y',
		'-ms-scroll-chaining',
		'-ms-content-zooming',
		'-ms-content-zoom-limit',
		'-ms-content-zoom-limit-max',
		'-ms-content-zoom-limit-min',
		'-ms-content-zoom-chaining',
		'-ms-content-zoom-snap-points',
		'-ms-content-zoom-snap-type',
		'-ms-content-zoom-snap'],
	jsRules = [/MSgesture/g,
		/MSPointer/g,
		/msContentZoomFactor/g,
		/navigator.msPointerEnabled/g,
		/navigator.msMaxTouchPoints/g],
	CSSLintRules = ['pointer-support'],
	CSSLint = require('./../csslint.js').CSSLint;

CSSLint.addRule({
	id: 'pointer-support',
	name: 'w3c pointer support',
	desc: 'checks if a website supports the W3C Pointers specs',
	browsers: 'All',
	init: function (parser, reporter) {
		var rule = this;
		var founded = false;
		parser.addListener('property', function (event) {
			var name = event.property;
			if (CSSLint.Util.indexOf(cssRules, name.text) > -1) {
				founded = true;
			}
		});

		parser.addListener('endstylesheet', function () {
			if (!founded) {
				reporter.report('No CSS Touch found', 0, 0, rule, '');
			}
		});
	}
});

var checkCSS = function (css) {
	var report = css.report,
		messages = report.messages,
		apply = messages.filter(function (message) {
			return CSSLintRules.indexOf(message.rule.id) !== -1;
		}),
		touchImplemented = apply.length === 0;

	return touchImplemented;
};

var checkJS = function (js) {
	var touchImplemented = false;
	for (var i = 0; i < jsRules.length; i++) {
		touchImplemented = jsRules[i].test(js.content);
		if (touchImplemented) {
			break;
		}
	}

	return touchImplemented;
};

var check = bluebird.method(function (website) {
	var result = [];

	var test = {
		testName: 'touch',
		passed: false
	};

	for (var i = 0; i < website.css.length; i++) {
		result.push(checkCSS(website.css[i]));
	}

	for (i = 0; i < result.length; i++) {
		if (result[i]) {
			test.passed = true;
			break;
		}
	}

	if (!test.passed) {
		for (i = 0; i < website.js.length; i++) {
			result.push(checkJS(website.js[i]));
		}

		for (i = 0; i < result.length; i++) {
			if (result[i]) {
				test.passed = true;
				break;
			}
		}
	}

	return test;
});

module.exports.check = check;