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
    CSSLintRules = ['auto-imports'],
    CSSLint = require('./csslint.js').CSSLint,
    promised = require("promised-io/promise"),
    Deferred = require('promised-io').Deferred,
    url = require('url'),
    cssPromises;

request = request.defaults({
    jar: false,
    headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}});

// parseCSS and parseCSSfromUrl call each other so we tell jshint to cool it
/*jshint latedef: false*/

function parseCSSfromUrl(cssUrl, media, website) {
    var deferred = new Deferred(),
        params = {
            uri: cssUrl,
            headers: {'Accept': 'text/html, application/xhtml+xml, */*'}
        },
        auth = website.auth;
    if (auth) {
        params.auth = auth;
    }

    website.cssParsedUrls.push(cssUrl);
    request(params, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                parseCSS(body, cssUrl, media, false, website).then(function (results) {
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

CSSLint.addRule({
    id: "auto-imports",
    name: "auto imports",
    desc: "downloads css imports",
    browsers: "All",
    init: function (parser, reporter) {
        var rule = this,
            localImports = [];

        parser.addListener('startstylesheet', function(){
           localImports = [];
        });

        parser.addListener('import', function importFound(event) {
            localImports.push({
                url: event.uri.replace('url(', '').replace(')', ''),
                media: event.media
            });
        });

        parser.addListener('endstylesheet', function fileEnded() {
            if(localImports.length) reporter.report(localImports, 0, 0, rule, '');
        });
    }
});

function parseCSS(text, cssUrl, media, isInline, website) {
    var report,
        deferred = new Deferred(),
        imports = [],
        auth = website.auth;

    process.nextTick(function () {
        report = CSSLint.verify(text);
        imports.push({cssUrl: isInline ? "embed" : cssUrl, media: media, cssBody: text, report: report});
        report.messages.forEach(function (result) {
            if(CSSLintRules.indexOf(result.rule.id) !== -1){
                result.message.forEach(function(cssImport){
                    //resolve url here
                    var importUrl = url.resolve(cssUrl, cssImport.url);
                    if (website.cssParsedUrls.indexOf(importUrl) === -1) {
                        imports.push(parseCSSfromUrl(importUrl, cssImport.media, website));
                    }
                });
            }
        });

        promised.all(imports).then(function (results) {
            // Results may be different because @imports may have @imported other files (ad nauseum);
            // the .concat() will flatten one level of nested arrays which is all we need
            deferred.resolve([].concat.apply([], results));
        });
    });

    return deferred.promise;
}

function check(website) {
    var deferred = new Deferred(),
        cssLinks = website.$('link[rel="stylesheet"]'),
        cssHref,
        cssUrl,
        cssTags;

    cssPromises = [];
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
        if (cssTags[i].children && cssTags[i].children.length > 0 && cssTags[i].children[0].data) {
            cssPromises.push(parseCSS(cssTags[i].children[0].data, website.url, cssTags[i].attribs.media, true, website));
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