/**
 * Description: This check looks for any missing vendor prefix (-webkit-, -moz-, -o-, -ms-) for the following CSS rules:
 * transform, animation, transition-property, transition-duration, transition-timing-function, transition-delay, transition,
 * linear-gradient, radial-gradient, gradient
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
 *
 * Parts of the code of this file belong to CSSLint https://github.com/stubbornella/csslint/blob/master/src/rules/compatible-vendor-prefixes.js
 * and are used under the CSSLint license: https://github.com/stubbornella/csslint/blob/master/LICENSE
 *
 */

"use strict";

// NB: PropMap/ExprMap information from caniuse.com

var Deferred = require('promised-io').Deferred,
    cssRules = ['compatible-vendor-prefixes', 'gradients'],
    CSSLint = require('./csslint.js').CSSLint;

/*
 * Rule: Include all compatible vendor prefixes to reach a wider
 * range of users.
 */
/*global CSSLint*/
CSSLint.addRule({

    //rule information
    id: "compatible-vendor-prefixes",
    name: "Require compatible vendor prefixes",
    desc: "Include all compatible vendor prefixes to reach a wider range of users.",
    browsers: "All",

    //initialization
    init: function (parser, reporter) {
        var rule = this,
            compatiblePrefixes,
            properties,
            prop,
            variations,
            prefixed,
            i,
            len,
            inKeyFrame = false,
            arrayPush = Array.prototype.push,
            applyTo = [];

        // See http://peter.sh/experiments/vendor-prefixed-css-property-overview/ for details
        compatiblePrefixes = {
            "animation": "webkit moz",
            "animation-delay": "webkit moz",
            "animation-direction": "webkit moz",
            "animation-duration": "webkit moz",
            "animation-fill-mode": "webkit moz",
            "animation-iteration-count": "webkit moz",
            "animation-name": "webkit moz",
            "animation-play-state": "webkit moz",
            "animation-timing-function": "webkit moz",
            "appearance": "webkit moz",
            "border-end": "webkit moz",
            "border-end-color": "webkit moz",
            "border-end-style": "webkit moz",
            "border-end-width": "webkit moz",
            "border-image": "webkit moz o",
            "border-radius": "webkit",
            "border-start": "webkit moz",
            "border-start-color": "webkit moz",
            "border-start-style": "webkit moz",
            "border-start-width": "webkit moz",
            "box-align": "webkit moz ms",
            "box-direction": "webkit moz ms",
            "box-flex": "webkit moz ms",
            "box-lines": "webkit ms",
            "box-ordinal-group": "webkit moz ms",
            "box-orient": "webkit moz ms",
            "box-pack": "webkit moz ms",
            "box-sizing": "webkit moz",
            "box-shadow": "webkit moz",
            "column-count": "webkit moz ms",
            "column-gap": "webkit moz ms",
            "column-rule": "webkit moz ms",
            "column-rule-color": "webkit moz ms",
            "column-rule-style": "webkit moz ms",
            "column-rule-width": "webkit moz ms",
            "column-width": "webkit moz ms",
            "hyphens": "epub moz",
            "line-break": "webkit ms",
            "margin-end": "webkit moz",
            "margin-start": "webkit moz",
            "marquee-speed": "webkit wap",
            "marquee-style": "webkit wap",
            "padding-end": "webkit moz",
            "padding-start": "webkit moz",
            "tab-size": "moz o",
            "text-size-adjust": "webkit ms",
            "transform": "webkit moz ms o",
            "transform-origin": "webkit moz ms o",
            "transition": "webkit moz o",
            "transition-delay": "webkit moz o",
            "transition-duration": "webkit moz o",
            "transition-property": "webkit moz o",
            "transition-timing-function": "webkit moz o",
            "user-modify": "webkit moz",
            "user-select": "webkit moz ms",
            "word-break": "epub ms",
            "writing-mode": "epub ms"
        };


        for (prop in compatiblePrefixes) {
            if (compatiblePrefixes.hasOwnProperty(prop)) {
                variations = [];
                prefixed = compatiblePrefixes[prop].split(' ');
                for (i = 0, len = prefixed.length; i < len; i++) {
                    variations.push('-' + prefixed[i] + '-' + prop);
                }
                compatiblePrefixes[prop] = variations;
                arrayPush.apply(applyTo, variations);
            }
        }

        parser.addListener("startrule", function () {
            properties = [];
        });

        parser.addListener("startkeyframes", function (event) {
            inKeyFrame = event.prefix || true;
        });

        parser.addListener("endkeyframes", function (event) {
            inKeyFrame = false;
        });

        parser.addListener("property", function (event) {
            var name = event.property;
            if (CSSLint.Util.indexOf(applyTo, name.text) > -1) {

                // e.g., -moz-transform is okay to be alone in @-moz-keyframes
                if (!inKeyFrame || typeof inKeyFrame != "string" ||
                    name.text.indexOf("-" + inKeyFrame + "-") !== 0) {
                    properties.push(name);
                }
            }
        });

        parser.addListener("endrule", function (event) {
            if (!properties.length) {
                return;
            }

            var propertyGroups = {},
                i,
                len,
                name,
                prop,
                variations,
                value,
                full,
                actual,
                item,
                propertiesSpecified;

            for (i = 0, len = properties.length; i < len; i++) {
                name = properties[i];

                for (prop in compatiblePrefixes) {
                    if (compatiblePrefixes.hasOwnProperty(prop)) {
                        variations = compatiblePrefixes[prop];
                        if (CSSLint.Util.indexOf(variations, name.text) > -1) {
                            if (!propertyGroups[prop]) {
                                propertyGroups[prop] = {
                                    full: variations.slice(0),
                                    actual: [],
                                    actualNodes: []
                                };
                            }
                            if (CSSLint.Util.indexOf(propertyGroups[prop].actual, name.text) === -1) {
                                propertyGroups[prop].actual.push(name.text);
                                propertyGroups[prop].actualNodes.push(name);
                            }
                        }
                    }
                }
            }

            for (prop in propertyGroups) {
                if (propertyGroups.hasOwnProperty(prop)) {
                    value = propertyGroups[prop];
                    full = value.full;
                    actual = value.actual;

                    var missing = [];

                    if (full.length > actual.length) {
                        for (i = 0, len = full.length; i < len; i++) {
                            item = full[i];
                            if (CSSLint.Util.indexOf(actual, item) === -1 && missing.indexOf(actual[0]) === -1) {
                                missing.push(actual[0]);
                            }
                        }
                        reporter.report(missing, value.actualNodes[0].line, value.actualNodes[0].col, rule, event.selectors[0].text);
                    }
                }
            }
        });
    }
});

/*
 * Rule: When using a vendor-prefixed gradient, make sure to use them all.
 */
/*global CSSLint*/
CSSLint.addRule({

    //rule information
    id: "gradients",
    name: "Require all gradient definitions",
    desc: "When using a vendor-prefixed gradient, make sure to use them all.",
    browsers: "All",

    //initialization
    init: function (parser, reporter) {
        var rule = this,
            gradients;

        parser.addListener("startrule", function () {
            gradients = {
                moz: 0,
                webkit: 0,
                oldWebkit: 0,
                o: 0
            };
        });

        parser.addListener("property", function (event) {

            if (/\-(moz|o|webkit)(?:\-(?:linear|radial))\-gradient/i.test(event.value)) {
                gradients[RegExp.$1] = 1;
            } else if (/\-webkit\-gradient/i.test(event.value)) {
                gradients.oldWebkit = 1;
            }

        });

        parser.addListener("endrule", function (event) {
            var missing = [];

            if (!gradients.moz) {
                missing.push("Missing Firefox 3.6+ gradient");
            }

            if (!gradients.webkit) {
                missing.push("Missing Webkit (Safari 5+, Chrome) gradient");
            }

            if (!gradients.oldWebkit) {
                missing.push("Missing Old Webkit (Safari 4+, Chrome) gradient");
            }

            if (!gradients.o) {
                missing.push("Missing Opera 11.1+ gradient");
            }

            if (missing.length && missing.length < 4) {
                reporter.report(missing, event.selectors[0].line, event.selectors[0].col, rule, event.selectors[0].text);
            }
        });
    }
});


function htmlEncode(encodedHtml) {
    if (typeof encodedHtml === 'undefined') {
        return;
    }
    return encodedHtml.replace(/\//g, "%2F")
        .replace(/\?/g, "%3F")
        .replace(/\=/g, "%3D")
        .replace(/&/g, "%26")
        .replace(/@/g, "%40")
        .replace(/</g, "")
        .replace(/>/g, "");
}

function check(website) {
    var deferred = new Deferred();

    // Let the main loop run before we do this work
    process.nextTick(function () {
        var test = {
            testName: "cssprefixes",
            passed: true,
            data: []
        };

        website.css.forEach(function (cssFile) {
            var report = cssFile.report;
            var messages = report.messages;
            var apply = messages.filter(function (message) {
                return cssRules.indexOf(message.rule.id) !== -1;
            });


            var selectors = [];
            apply.forEach(function (result) {
                selectors.push({
                    selector: htmlEncode(result.selector),
                    lineNumber: result.line,
                    styles: result.message
                });
            });

            if(selectors.length > 0){
                test.passed = false;
                test.data.push({
                    cssFile: cssFile.cssUrl,
                    selectors: selectors
                });
            }
        });

        deferred.resolve(test);
    });

    return deferred.promise;
}

module.exports.check = check;