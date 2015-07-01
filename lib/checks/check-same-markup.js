/**
 * Description: Checks if the HTML send by the server is the same if we are Edge or Chrome+
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

var Promise = require('bluebird'),
	cheerio = require('cheerio'),
	request = require('request');

var markupElements = [
	{name: 'div', threshold: 0.9},
	{name: 'canvas'},
	{name: 'a'},
	{name: 'p', threshold: 0.7},
	{name: 'h1'},
	{name: 'h2'},
	{name: 'h3'},
	{name: 'h4'},
	{name: 'ol'},
	{name: 'ul'},
	{name: 'li'},
	{name: 'table'},
	{name: 'tr'},
	{name: 'th'},
	{name: 'td'},
	{name: 'img', threshold: 0.9},
	{name: 'span', threshold: 0.5},
	{name: 'form'},
	{name: 'input'},
	{name: 'textarea'},
	{name: 'button'},
	{name: 'video'},
	{name: 'audio'},
	{name: 'object'},
	{name: 'embed'}
];
var defaultThreshold = 0.8;
var charset = 'UTF-8';

request = request.defaults({
	followAllRedirects: true,
	encoding: null,
	jar: false,
	proxy: process.env.HTTP_PROXY || process.env.http_proxy,
	headers: {
		'Accept': 'text/html, application/xhtml+xml, */*',
		'Accept-Encoding': 'gzip',
		'Accept-Language': 'en-US,en;q=0.5',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
	}
});

var countElements = function ($, elementName) {
	return $(elementName).filter(function () {
		var $this = $(this);
		return $this.css('display') !== 'none' && $this.css('visibility') !== 'hidden';
	}).length;
};

var getBody = function (body) {
	return {
		body: body.toString(charset),
		compression: 'none'
	};
};

var loadElements = function (markup) {
	return cheerio.load(markup, {lowerCaseTags: true, lowerCaseAttributeNames: true, normalizeWhitespace: true});
};

var compareMarkup = function ($markup1, $markup2) {
	var passed = true;

	var elementResults = [];
	for (var i = 0; i < markupElements.length; i++) {
		var elementConfig = markupElements[i];
		var elementName = elementConfig.name;
		var elementThreshold = elementConfig.threshold || defaultThreshold;
		var edgeCount = countElements($markup1, elementName);
		var chromeCount = countElements($markup2, elementName);
		var maxCount = Math.max(edgeCount, chromeCount);
		var elementResult = {
			element: elementName,
			threshold: elementThreshold,
			edgeCount: edgeCount,
			chromeCount: chromeCount,
			passed: (maxCount <= 0) ? true : Math.min(edgeCount, chromeCount) / maxCount >= elementThreshold
		};

		elementResults.push(elementResult);
		passed = passed && elementResult.passed;
	}

	return {
		passed: passed,
		results: elementResults
	};
};

var check = function (website) {
	var requestAsync = Promise.promisify(request);

	// 1st request using Chrome UA
	return requestAsync(website.url.href).spread(function (response, body) {
		if (!body) {
			return {
				testName: 'markup',
				passed: false,
				data: 'Error found: Empty body'
			}
		}
		var chromeMarkup = getBody(body);
		var $chrome = loadElements(chromeMarkup);
		var compareResults = compareMarkup(website.$, $chrome);

		if (compareResults.passed) {
			var test = {
				testName: 'markup',
				passed: compareResults.passed,
				data: compareResults.results
			};

			return test;
		} else {
			// 2nd request using Chrome UA
			return requestAsync(website.url.href).spread(function (response2, body2) {
				if (!body2) {
					return {
						testName: 'markup',
						passed: false,
						data: 'Error found: Empty body'
					}
				}
				var chromeMarkup2 = getBody(body2);
				var compareResults2 = compareMarkup($chrome, loadElements(chromeMarkup2));

				var result = {
					testName: 'markup',
					passed: !compareResults2.passed,
					transient: !compareResults2.passed,
					data: compareResults2.passed ? compareResults.results : 'Site candidate for exclude list. The HTML markup for this site presents differences on each request regardless of the user agent.'
				};

				return result;
			});
		}
	});
};

module.exports.check = check;