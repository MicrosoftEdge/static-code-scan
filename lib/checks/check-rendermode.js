/**
 * Description: Checks the doctype of website to see if the site is in Quirks mode.
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

// Comments or newlines before doctype are allowed, as well as an xml header for XHTML docs.
// IE6 will always quirk out on an XML header but let's assume everyone is past that.
// SEE http://msdn.microsoft.com/en-us/library/ie/ms535242(v=vs.85).aspx

var spaces = '[\\s\\r\\n]*',
	comment = '(?:' + spaces + '<!--(?:.|[\\r\\n])*-->)*',
	xmltag = '(?:<\\?xml(?:.|[\\r\\n])*\\?>)?',
	doctype = '<!doctype (\\w+)' + spaces + '([^>]*)>',
// _, doctype-innards
	headRE = new RegExp('^' + comment + spaces + xmltag + spaces + doctype),
// _, public|system, "public identifier", "system identifier"?
	pubsysRE = new RegExp('^(public|system)' + spaces + '"([^"]*)"' + spaces + '("[^"]*")?'),
// _, (x)html, version, variant (e.g., "transitional")
	pubidRE = new RegExp('-//w3c//dtd (x?html)\\S*\\s*([\\d\\.]+)?\\s*(\\w+)?//en'),
// Literal pubids that pass standards
	pubidMap = {
		'iso/iec 15445:1999//dtd hypertext markup language//en': true,
		'iso/iec 15445:1999//dtd html//en': true,
		'-//ietf//dtd html i18n//en': true,
		'-//unknown//en': true
	};

var check = bluebird.method(function (website) {
	var test = {
		testName: 'rendermode',
		passed: true,
		data: {}
	};

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

	return cvlist.getList().then(function (list) {
		var head = website.content.slice(0, 2000).trim().toLowerCase(),
			dt = headRE.exec(head);

		var resultWebsite = list[website.url.hostname.replace('-', '_').replace('www.', '')];
		if (resultWebsite && (resultWebsite.docMode || resultWebsite.uaString || Object.keys(resultWebsite).length === 0)) {
			test.passed = false;
			test.data = {source: 'cvlist', mode: resultWebsite.docMode};
		}

		if (!test.passed) {
			return test;
		}

		test.passed = false;
		test.data = {
			lineNumber: -1,
			mode: ['No doctype']
		};

		if (dt) {
			// Since the regexp matched this should succeed as well
			test.data.lineNumber = head.substr(0, head.indexOf('<!doctype')).split('\n').length;
			if (dt[1] !== 'html') {
				// probably something like <!doctype svg ...> or other non-html, we don't want to error on these
				test.passed = true;
				test.data.mode = [(dt[1] || 'Unknown') + ' (non-HTML)'];
			} else if (!dt[2]) {
				// <!doctype html> (plain old html5 doctype without any following junk)
				test.passed = true;
				test.data.mode = ['html5'];
			} else {
				// Assume failure for simplicity
				test.data.mode = ['Invalid or Quirks doctype'];

				// Should have PUBLIC or SYSTEM plus identifier(s)
				var pubsys = pubsysRE.exec(dt[2]) || [],
					puborsys = pubsys[1],
					pubid = pubsys[2],
					sysid = pubsys[3];

				if (puborsys === 'system') {
					// Any SYSTEM doctypes are considered to be standards mode
					test.passed = true;
					test.data.mode = ['html (system)'];
				} else if (pubid === '' && typeof sysid === 'undefined') {
					// <!doctype public ""> is standards mode
					test.passed = true;
					test.data.mode = ['html5 (long form)'];
				} else if (pubidMap[pubid]) {
					// One of the 'OMG standards mode' bizarro doctypes
					test.passed = true;
					test.data.mode = ['html standards'];
				} else if (pubsys.length && pubid) {
					// Drill into the pubid to see if it's standards mode
					var pubdata = pubidRE.exec(pubid) || [],
						htmltype = pubdata[1],
						version = pubdata[2],
						variant = pubdata[3],
						standards = pubdata.length > 0;

					if (htmltype === 'html') {
						if (+version < 4.0) {
							// Anything less than HTML4 is not standards
							standards = false;
						} else if (version === '4.0' || version === '4.01') {
							// HTML4 is only standards for frameset/transitional if a system id is provided
							if (/frameset|transitional/.test(variant) && !sysid) {
								standards = false;
							}
						}
					}
					test.passed = standards;
					test.data.mode = [(htmltype + ' ' + version + ' ' + variant).trim()];
				}
			}
		}

		return test;
	});
});

module.exports.check = check;