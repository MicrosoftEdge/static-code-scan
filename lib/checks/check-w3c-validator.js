/**
 * Description: Validates the HTML validity using the W3C HTML Validator (http://validator.w3.org/)
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

var w3cCheckUrl = 'http://validator.w3.org/check',
//timeout = 15000, //15 secs of time to get an answer from W3C
	defaultOutput = 'json';

var check = function (website) {
	//var timeoutId = setTimeout(function () {
	//	resolved = true;
	//
	var test = {
		testName: 'w3c-validator',
		passed: false,
		data: ['Timeout']
	};
	//
	//	deferred.resolve(result);
	//
	//}, timeout);

	var url = w3cCheckUrl + '?output=' + defaultOutput + '&uri=' + encodeURIComponent(website.url.href);

	return website.request.getAsync({
		uri: url,
		headers: {
			'User-Agent': 'Static Code Scanner'
		}
	})
		.then(function (res) {
			var body = res[1].toString('utf-8');
			//clearTimeout(timeoutId);

			//if (resolved) {
			//	return;
			//}

			try {
				var content = JSON.parse(body);
				website.passed = content.messages.length === 0;
				website.data = content.messages;
			} catch (e) {
				test.passed = false;
				test.data = ['Remote error'];
			} finally {
				return test;
			}
		})
		.catch(function () {
			website.data = ['Error'];
			return website;
		});
};

module.exports.check = check;
module.exports.parallel = true;