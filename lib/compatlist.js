/**
 * Description: Downloads the Microsoft CV lists, which we query during testing to see
 * if a website has to be run in compat mode or has any ActiveX/Flash issues.
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

var compatListUrlGDR = 'https://iecvlist.microsoft.com/IE11/1379465767093/iecompatviewlist.xml',
	compatListUrlSDR = 'https://iecvlist.microsoft.com/IE11/1379465767093/iecompatviewlist.xml',
	bluebird = require('bluebird'),
	request = require('request'),
	xml2js = require('xml2js'),
	parser = bluebird.promisifyAll(new xml2js.Parser()),
	cvlist = {};

request = bluebird.promisifyAll(request.defaults({
	jar: false,
	proxy: process.env.HTTP_PROXY || process.env.http_proxy,
	headers: {
		'Accept-Language': 'en-US,en;q=0.5',
		'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'
	}
}));

var getCompatListUrl = function (ieversion) {
	var cvlistUrl;
	switch (ieversion) {
		case 'ie10':
			cvlistUrl = compatListUrlGDR;
			break;
		case 'ie9':
			cvlistUrl = compatListUrlSDR;
			break;
		default:
			cvlistUrl = compatListUrlSDR;
			break;
	}
	return cvlistUrl;
};

var addExplicitFlashBlockedSites = function (result) {
	var array,
		domain;
	if (result.iecompatlistdescription && result.iecompatlistdescription.NoFlash) {
		array = result.iecompatlistdescription.NoFlash[0].domain;
		for (var i = 0; i < array.length; i++) {
			domain = array[i]._ || array[i];
			if (domain) {
				domain = domain.trim().replace('-', '_');
				if (cvlist[domain]) {
					cvlist[domain].noFlash = true;
				} else {
					cvlist[domain] = {
						noFlash: true
					};
				}
			}
		}
	}
};

var addExplicitFlashApprovalSites = function (result) {
	var array,
		domain;
	if (result.iecompatlistdescription && result.iecompatlistdescription.Flash) {
		array = result.iecompatlistdescription.Flash[0].domain;
		for (var i = 0; i < array.length; i++) {
			domain = array[i]._ || array[i];
			if (domain) {
				domain = domain.trim().replace('-', '_');
				if (cvlist[domain]) {
					cvlist[domain].flash = true;
				} else {
					cvlist[domain] = {
						flash: true
					};
				}
			}
		}
	}
};

var addCompatSites = function (ieversion, result) {
	var array = [];
	if (ieversion.indexOf('1') !== -1) {
		array = result.iecompatlistdescription.domain;
	} else if (result.ie9compatlistdescription) {
		array = result.ie9compatlistdescription.domain;
	}

	for (var i = 0; i < array.length; i++) {
		if (array[i]._) {
			cvlist[array[i]._.replace('-', '_')] = array[i].$;
		} else {
			cvlist[array[i]] = {};
		}
	}
};

var downloadCVlist = function (ieversion) {
	var cvlistUrl = getCompatListUrl(ieversion);

	return request.getAsync(cvlistUrl)
		.then(function (res) {
			var body = res[1].toString('utf-8');
			return parser.parseStringAsync(body);
		})
		.then(function (result) {
			addCompatSites(ieversion, result);
			addExplicitFlashApprovalSites(result);
			addExplicitFlashBlockedSites(result);

			return cvlist;
		})
		.catch(function () {
			return cvlist;
		});
};

var downloadCVlists = function () {
	return downloadCVlist('ie10')
		.then(function () {
			return downloadCVlist('ie9');
		});
	//.then(saveCVList);
};

var getList = bluebird.method(function () {
	if (typeof cvlist === 'object' && Object.keys(cvlist).length > 0) {
		return cvlist;
	} else {
		return downloadCVlists();
	}
});

module.exports.getList = getList;
