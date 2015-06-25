/**
 * Description: This check looks for the X-UA-Compatible meta tag in the HTML,
 * and also checks whether/why the site is on the Microsoft CV list.
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

var cvlist = require('./../compatlist.js'),
	bluebird = require('bluebird');

var initiate = bluebird.method(function (website) {
	var test = {
		testName: 'cvlist',
		passed: true,
		data: {}
	};

	//TODO: The compat tag may not be recognized if it is "too far down" the page; detect this.
	var compatTag = website.$('meta[http-equiv]').filter(function () {
		return this.attribs['http-equiv'].toLowerCase() === 'x-ua-compatible';
	});

	if (compatTag.length > 0) {
		if (compatTag[0].attribs.content) {
			var mode = compatTag[0].attribs.content.toLowerCase();
			if (mode.indexOf('edge') === -1) {
				test.passed = false;
				test.data = {source: 'tag', mode: mode};
				return test;
			}
		}
	}

	return cvlist.getList()
		.then(function (list) {
			var resultWebsite = list[website.url.hostname.replace('-', '_').replace('www.', '')];
			if (resultWebsite && (resultWebsite.docMode || resultWebsite.uaString || Object.keys(resultWebsite).length === 0)) {
				test.passed = false;
				test.data = {source: 'cvlist', mode: resultWebsite.docMode};
			}
			console.log(test.testName);
			return test;
		});
});

module.exports.check = initiate;