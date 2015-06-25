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

'use strict';

var endPoint = 'https://api.kraken.io/modernie',
	config = require('./../config.js'),
	minimumSavings = 5000;

var check = function (website) {
	var url = website.url.href,
		test = {
			testName: 'imageCompression',
			passed: true
		};

	return website.request.postAsync({
			uri: endPoint,
			jar: false
		},
		{
			form: {
				key: config.kraken_key,
				secret: config.kraken_secret,
				url: url
			}
		})
		.then(function (res) {
			var body = res[1].toString('utf-8');

			var content = JSON.parse(body);

			if (content.success) {
				if (content.meta.total_savings > minimumSavings) {
					test.data = content.meta;
					test.passed = false;
				} else {
					test.passed = true;
				}
			}
			return test;
		})
		.catch(function () {
			return test;
		});
};

module.exports.check = check;
module.exports.parallel = true;
