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

"use strict";

var request = require('request'),
    cssom = require('cssom'),
    promised = require("promised-io/promise"),
    Deferred = require('promised-io').Deferred,
    url = require('url'),
    cssPromises;

request = request.defaults({
    jar: false,
    headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}});
		
/*
 * CSSOM normally eliminates duplicate declarations in a rule, accepting only the last.
 * In our case we want to analyze _all_ declarations; this patch allows us to see dups.
 * See  https://github.com/NV/CSSOM/issues/16
 */
(function(){
	var oldSet = cssom.CSSStyleDeclaration.prototype.setProperty;
	cssom.CSSStyleDeclaration.prototype.setProperty = function(name, value, priority) {
		// When there are multiple props, save their values in an array prefixed by '~'
		if ( this[name] ) {
			if ( !this["~" + name] ) {
				this["~" + name] = [];
			}
			this["~" + name].push(value);
		}
		return oldSet.apply(this, arguments);
	};
})();

// parseCSS and parseCSSfromUrl call each other so we tell jshint to cool it
/*jshint latedef: false*/

function parseCSSfromUrl(cssUrl, media, auth) {
    var deferred = new Deferred(),
		params = {
			uri: cssUrl,
            headers: {'Accept': 'text/html, application/xhtml+xml, */*'}
		};
	if ( auth ) {
		params.auth = auth;
	}
    request(params, function (error, response, body) {
            if (!error && response.statusCode === 200) {
				parseCSS(body, cssUrl, media, false, auth).then(function(results){
					deferred.resolve(results);
				});
            } else {
				console.warn("Request for " + cssUrl + " returned " + error);
				// Silently skip the troublesome file
				deferred.resolve([]);
			}
        }
	);

    return deferred.promise;
}

function parseCSS(text, cssUrl, media, isInline, auth) {
	var sheet,
		deferred = new Deferred(),
		imports = [];
	try {
		// Treat the current text as a resolved promise in our imports list
		sheet = cssom.parse(text);
		imports.push({cssUrl: isInline? "embed" : cssUrl, css: sheet, media: media, cssBody: text});
		// Find @import statements in the rules
		for ( var i=0; i < sheet.cssRules.length; i++ ) {
			var rule = sheet.cssRules[i];
			if ( rule.type === 3 && rule.href ) {
				// http://www.w3.org/TR/CSS21/syndata.html#uri
				//  "For CSS style sheets, the base URI is that of the style sheet..."
				imports.push(parseCSSfromUrl(url.resolve(cssUrl, rule.href), rule.media.mediaText, auth));
			}
		}
		promised.all(imports).then(function(results){
			// Results may be different because @imports may have @imported other files (ad nauseum);
			// the .concat() will flatten one level of nested arrays which is all we need
			deferred.resolve([].concat.apply([], results));
		});
	} catch(ex) {
		console.warn("CSS from " + cssUrl + " threw " + ex);
		// Silently skip the troublesome CSS
		deferred.resolve([]);
	}
	return deferred.promise;
}

function check(website) {
    var deferred = new Deferred(),
        cssLinks = website.$('link[rel="stylesheet"]'),
        cssHref,
        cssUrl,
        cssTags;

    cssPromises = [];

    for (var i = 0; i < cssLinks.length; i++) {
        cssHref = cssLinks[i].attribs.href;

        // If the attributes don't have a space then the library doesn't parse it correctly.
        if (cssHref) {
            cssUrl = url.resolve(website.url, cssHref);
            cssPromises.push(parseCSSfromUrl(url.resolve(website.url, cssUrl), cssLinks[i].attribs.media, website.auth));
        }
    }

    cssTags = website.$('style');
    for (i = 0; i < cssTags.length; i++) {
        if (cssTags[i].children && cssTags[i].children.length > 0 && cssTags[i].children[0].data) {
			cssPromises.push(parseCSS(cssTags[i].children[0].data, website.url, cssTags[i].attribs.media, true, website.auth));
        }
    }

    if (cssPromises.length > 0) {
        promised.all(cssPromises).then(function (array) {
			// Flatten the nested arrays
			array = [].concat.apply([], array);
			deferred.resolve(array);
        }, function () {
            deferred.reject();
        });
    } else {
        // No style sheets
        deferred.resolve([]);
    }

    return deferred.promise;
}


module.exports.parseCSS = parseCSS;
module.exports.loadCssFiles = check;