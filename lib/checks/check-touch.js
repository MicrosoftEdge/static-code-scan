 /**
 * Description: Look for known patterns of use for the Pointers API in CSS and JS files.
 * (Keep in mind that files added dynamically are not analyzed.)
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

var Deferred = require('promised-io').Deferred,
    cssRules = ['-ms-touch-action',
        '-ms-scroll-snap-points-x',
        '-ms-scroll-snap-points-y',
        '-ms-scroll-snap-type',
        '-ms-scroll-snap-x',
        '-ms-scroll-snap-y',
        '-ms-scroll-chaining',
        '-ms-content-zooming',
        '-ms-content-zoom-limit',
        '-ms-content-zoom-limit-max',
        '-ms-content-zoom-limit-min',
        '-ms-content-zoom-chaining',
        '-ms-content-zoom-snap-points',
        '-ms-content-zoom-snap-type',
        '-ms-content-zoom-snap'],
    jsRules = [/MSgesture/g,
        /MSPointer/g,
        /msContentZoomFactor/g,
        /navigator.msPointerEnabled/g,
        /navigator.msMaxTouchPoints/g];

function checkCSS(css) {
    var selectors = css.css.cssRules,
        styleToCheck,
        styleChecking,
        selectorStyles,
        currentStyle,
        containsRule,
        touchImplemented = false;

    for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
        //if the selector is a media it will not have the property style
        //it will have another array of cssRules but they selectors should be
        //also in the common cssRules
        if (touchImplemented) {
            break;
        }

        if (selectors[selectorIndex].style) {
            selectorStyles = selectors[selectorIndex].style;

            for (var selectorStylesIndex = 0; selectorStylesIndex < selectorStyles.length; selectorStylesIndex++) {
                if (touchImplemented) {
                    break;
                }
                currentStyle = selectorStyles[selectorStylesIndex];

                for (var cssRuleIndex = 0; cssRuleIndex < cssRules.length; cssRuleIndex++) {
                    styleToCheck = cssRules[cssRuleIndex];
                    styleChecking = selectorStyles[currentStyle];

                    containsRule = currentStyle.indexOf(styleToCheck);
                    if (containsRule !== -1) {
                        touchImplemented = true;
                        break;
                    }
                }
            }
        }
    }
    return touchImplemented;
}

function checkJS(js) {
    var touchImplemented = false;
    for (var i = 0; i < jsRules.length; i++) {
        touchImplemented = jsRules[i].test(js.code);
        if (touchImplemented) {
            break;
        }
    }

    return touchImplemented;
}


function check(website) {
    var deferred = new Deferred(),
        result = [];

    var test = {
        testName: "touch",
        passed: false
    };

    for (var i = 0; i < website.css.length; i++) {
        result.push(checkCSS(website.css[i]));
    }

    for (i = 0; i < result.length; i++) {
        if (result[i]) {
            test.passed = true;
            break;
        }
    }

    if (!test.passed) {
        for (i = 0; i < website.js.length; i++) {
            result.push(checkJS(website.js[i]));
        }

        for (i = 0; i < result.length; i++) {
            if (result[i]) {
                test.passed = true;
                break;
            }
        }
    }

    deferred.resolve(test);


    return deferred.promise;
}

module.exports.check = check;