/**
 * Description: Look for known patterns used for RWD.  Files added dynamically are not analyzed.
 *   1) Look for media queries related to the size of the screen (min-width and max-width).
 *      If the website doesn't have any then the test is not passed.
 *   2) If the website has CSS media queries, look for the min/max break points in those.
 *      Compare the website's breakpoints to the sizes 320, 480, 640 and 768 +- 25%.
 *      If any resolution doesn't have any breakpoint within the margin, flag a possible issue
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
	checklist = [320, 480, 640, 768, 960],
	percentage = 0.25,
	checklistMinPercentage = [],
	checklistMaxPercentage = [],
	maxWidth = /max-width\s*:\s*(.*)\).*/i,
	minWidth = /min-width\s*:\s*(.*)\).*/i,
	CSSLintRules = ['responsive'],
	CSSLint = require('./../csslint.js').CSSLint;

for (var i = 0; i < checklist.length; i++) {
	checklistMinPercentage.push(checklist[i] * (1 - percentage));
}

for (i = 0; i < checklist.length; i++) {
	checklistMaxPercentage.push(checklist[i] * (1 + percentage));
}

var sort = function (a, b) {
	return a - b;
};

var consolidate = function (tempSpectrum) {
	var spectrum = [];
	spectrum.push(tempSpectrum[0]);
	for (var i = 1, j = 0; i < tempSpectrum.length; i++) {
		if (tempSpectrum[i] && tempSpectrum[i].start <= spectrum[j].end) {
			spectrum[j].end = Math.max(tempSpectrum[i].end, spectrum[j].end);
		} else {
			spectrum.push(tempSpectrum[i]);
			j++;
		}
	}
	return spectrum;
};

var mergeSpectrums = function (spectrum1, spectrum2) {
	var tempSpectrum = spectrum1.concat(spectrum2);

	tempSpectrum.sort(function (a, b) {
		return a.start - b.start;
	});

	return consolidate(tempSpectrum);
};

var createSpectrum = function (mins, maxs) {
	var spectrumMin = [],
		spectrumMax = [];

	for (var i = 0; i < mins.length; i++) {
		spectrumMin.push({
			start: mins[i],
			end: mins[i] * (1 + percentage)
		});
	}

	for (i = 0; i < maxs.length; i++) {
		spectrumMax.push({
			start: maxs[i] * (1 - percentage),
			end: maxs[i]
		});
	}

	return mergeSpectrums(spectrumMin, spectrumMax);
};

var removeDuplicates = function (list) {
	for (i = list.length; i > 0; i--) {
		if (list[i - 1] === list[i]) {
			list.splice(i, 1);
		}
	}
};

var analyzeBreakPoints = function (mins, maxs) {
	mins.sort(sort);
	maxs.sort(sort);

	removeDuplicates(mins);
	removeDuplicates(maxs);
	return createSpectrum(mins, maxs);
};

var analyzeMediaQuery = function (media, test) {
	var regexResult = minWidth.exec(media),
		value = 0;

	if (regexResult) {
		if (regexResult[1].indexOf('px') !== -1) {
			value = parseFloat(regexResult[1].replace('px', ''));
		} else if (regexResult[1].indexOf('em') !== -1) {
			value = parseFloat(regexResult[1].replace('em', '')) * 16;
		}

		test.data.minBreakPoints.push(value);
	}

	regexResult = maxWidth.exec(media);
	if (regexResult) {
		if (regexResult[1].indexOf('px') !== -1) {
			value = parseFloat(regexResult[1].replace('px', ''));
		} else if (regexResult[1].indexOf('em') !== -1) {
			value = parseFloat(regexResult[1].replace('em', '')) * 16;
		}
		test.data.maxBreakPoints.push(value);
	}
};


CSSLint.addRule({
	//rule information
	id: 'responsive',
	name: 'Responsive Web Design',
	desc: 'Checks for media queries and the spectrum they cover to see if there are any gray areas',
	browsers: 'All',

	//initialization
	init: function (parser, reporter) {
		var rule = this,
			medias = [];

		parser.addListener('startstylesheet', function () {
			medias = [];
		});

		parser.addListener('startmedia', function (event) {
			medias.push(event.media[0].text);

		});

		parser.addListener('endstylesheet', function () {
			reporter.report(medias, 0, 0, rule, '');
		});
	}
});


var check = bluebird.method(function (website) {
	// Let the main loop run before we do this work
	var test = {
		testName: 'responsive',
		passed: false,
		data: {
			minBreakPoints: [],
			maxBreakPoints: [],
			spectrum: []
		}
	};

	/*jshint loopfunc: true */
	for (var i = 0; i < website.css.length; i++) {
		//CSS files can be included indicating directly the media. We check first for that:
		//Ex: <link rel="stylesheet" media="only screen and (min-width: 480px)" href="480.css?v1.0">
		var media = website.css[i].media;
		if (media && (media.indexOf('min-width') !== -1 || media.indexOf('max-width') !== -1)) {
			analyzeMediaQuery(media, test);
		} else {
			var apply = website.css[i].report.messages.filter(function (message) {
				return CSSLintRules.indexOf(message.rule.id) !== -1;
			});

			apply.forEach(function (result) {
				result.message.forEach(function (mediaQuery) {
					analyzeMediaQuery(mediaQuery, test);
				});
			});
		}
	}

	if (test.data.minBreakPoints.length > 0 || test.data.maxBreakPoints.length > 0) {
		test.passed = true;
		test.data.spectrum = analyzeBreakPoints(test.data.minBreakPoints, test.data.maxBreakPoints);
	}

	return test;
});

module.exports.check = check;
