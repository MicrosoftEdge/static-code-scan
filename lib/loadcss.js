/**
 * Description: Load the external CSS files and embedded CSS to make them available
 * for further analysis. Files added dynamically are not analyzed.
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

var CSSLintRules = ['auto-imports'],
	CSSLint = require('./csslint.js').CSSLint,
	bluebird = require('bluebird'),
	url = require('url'),
	cssPromises;

// parseCSS and parseCSSfromUrl call each other so we tell linters to cool it
// jshint latedef:nofunc
/*eslint-disable no-use-before-define */

function parseCSS(text, cssUrl, media, isInline, website) {
	var report,
		imports = [];

	report = CSSLint.verify(text);
	imports.push({cssUrl: isInline ? 'embed' : cssUrl, media: media, cssBody: text, report: report});
	report.messages.forEach(function (result) {
		if (CSSLintRules.indexOf(result.rule.id) !== -1) {
			result.message.forEach(function (cssImport) {
				//resolve url here
				var importUrl = url.resolve(cssUrl, cssImport.url);
				if (website.cssParsedUrls.indexOf(importUrl) === -1) {
					imports.push(parseCSSfromUrl(importUrl, cssImport.media, website));
				}
			});
		}
	});

	return bluebird.all(imports).then(function (results) {
		// Results may be different because @imports may have @imported other files (ad nauseum);
		// the .concat() will flatten one level of nested arrays which is all we need
		return bluebird.resolve([].concat.apply([], results));
	});
}

function parseCSSfromUrl(cssUrl, media, website) {
	website.cssParsedUrls.push(cssUrl);
	return website.request.getAsync(cssUrl)
		.then(function (result) {
			var body = result[1].toString('utf-8');
			return parseCSS(body, cssUrl, media, false, website);
		})
		.catch(function (error) {
			console.warn('Request for ' + cssUrl + ' returned ' + error);
			// Silently skip the troublesome file
			return bluebird.resolve([]);
		});
}

CSSLint.addRule({
	id: 'auto-imports',
	name: 'auto imports',
	desc: 'downloads css imports',
	browsers: 'All',
	init: function (parser, reporter) {
		var rule = this,
			localImports = [];

		parser.addListener('startstylesheet', function () {
			localImports = [];
		});

		parser.addListener('import', function importFound(event) {
			localImports.push({
				url: event.uri.replace('url(', '').replace(')', ''),
				media: event.media
			});
		});

		parser.addListener('endstylesheet', function fileEnded() {
			if (localImports.length) {
				reporter.report(localImports, 0, 0, rule, '');
			}
		});
	}
});

var check = function (website) {
	var cssLinks = website.$('link[rel="stylesheet"]'),
		cssHref,
		cssUrl,
		cssTags;

	cssPromises = [];
	website.css = [];
	website.cssParsedUrls = [];

	for (var i = 0; i < cssLinks.length; i++) {
		cssHref = cssLinks[i].attribs.href;

		// If the attributes don't have a space then the library doesn't parse it correctly.
		if (cssHref) {
			cssUrl = url.resolve(website.url, cssHref);
			if (website.cssParsedUrls.indexOf(cssUrl) === -1) {
				cssPromises.push(parseCSSfromUrl(cssUrl, cssLinks[i].attribs.media, website));
			}
		}
	}

	cssTags = website.$('style');
	for (i = 0; i < cssTags.length; i++) {
		if (cssTags[i].children && cssTags[i].children.length > 0 && cssTags[i].children[0].data && cssTags[i].children[0].data !== '') {
			cssPromises.push(parseCSS(cssTags[i].children[0].data, website.url, cssTags[i].attribs.media, true, website));
		}
	}

	if (cssPromises.length > 0) {
		return bluebird.all(cssPromises).then(function (array) {
			// Flatten the nested arrays
			array = [].concat.apply([], array);
			website.css = array;
			return bluebird.resolve(website);
		});
	} else {
		// No style sheets
		return bluebird.resolve(website);
	}
};


module.exports.parseCSS = parseCSS;
module.exports.loadCssFiles = check;