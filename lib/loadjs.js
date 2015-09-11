/**
 * Description: Load the external JavaScript files and embedded script blocks to make
 * them available for further analysis. Files added dynamically are not analyzed.
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
	url = require('url');

var downloadJS = function (jsUrl, jsHref, website) {
	return website.request.getAsync(jsUrl)
		.then(function (result) {
			var response = result[0];
			var body = result[1].toString('utf-8');
			return bluebird.resolve({url: url, jsUrl: jsHref, finalUrl: response.request.href, content: body});
		});
};

var check = function (website) {
	var jsLinks = website.$('script'),
		js = [],
		jsPromises = [];

	website.js = [];

	for (var i = 0; i < jsLinks.length; i++) {
		var jsHref = jsLinks[i].attribs.src,
			jsUrl;

		if (jsHref) {
			if (jsHref) {
				jsUrl = url.resolve(website.url, jsHref);
				jsPromises.push(downloadJS(jsUrl, jsHref, website));
			}
		} else if (jsLinks[i].children[0] && jsLinks[i].children[0].data) {
			// Some <script> tags that do not contain anything. We ignore those
			js.push({jsUrl: 'embed', content: jsLinks[i].children[0].data});
		}
	}

	if (jsPromises.length > 0) {
		return bluebird.all(jsPromises)
			.then(function (array) {
				for (i = 0; i < array.length; i++) {
					if (array[i].finalUrl) {
						js.push(array[i]);
					}
				}

				website.js = js;

				return bluebird.resolve(website);
			});
	} else {
		// There aren't any external JS but we could have embedded JS
		website.js = js;
		return bluebird.resolve(website);
	}
};

module.exports.loadjsFiles = check;
