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

'use strict';

// NB: PropMap/ExprMap information from caniuse.com

var bluebird = require('bluebird'),
	cssRules = ['compatible-vendor-prefixes', 'gradients'],
	CSSLint = require('./../csslint.js').CSSLint;

/*
 * Rule: Include all compatible vendor prefixes to reach a wider
 * range of users.
 */
CSSLint.addRule({
	//rule information
	id: 'compatible-vendor-prefixes',
	name: 'Require compatible vendor prefixes',
	desc: 'Include all compatible vendor prefixes to reach a wider range of users.',
	browsers: 'All',

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
			'animation': 'webkit',
			'animation-delay': 'webkit',
			'animation-direction': 'webkit',
			'animation-duration': 'webkit',
			'animation-fill-mode': 'webkit',
			'animation-iteration-count': 'webkit',
			'animation-name': 'webkit',
			'animation-play-state': 'webkit',
			'animation-timing-function': 'webkit',
			'appearance': 'webkit moz',
			'border-end': 'webkit moz',
			'border-end-color': 'webkit moz',
			'border-end-style': 'webkit moz',
			'border-end-width': 'webkit moz',
			'border-image': 'webkit o',
			'border-start': 'webkit moz',
			'border-start-color': 'webkit moz',
			'border-start-style': 'webkit moz',
			'border-start-width': 'webkit moz',
			'box-sizing': 'webkit',
			'column-count': 'webkit moz',
			'column-gap': 'webkit moz',
			'column-rule': 'webkit moz',
			'column-rule-color': 'webkit moz',
			'column-rule-style': 'webkit moz',
			'column-rule-width': 'webkit moz',
			'column-width': 'webkit moz',
			'hyphens': 'webkit moz ms',
			'margin-end': 'webkit moz',
			'margin-start': 'webkit moz',
			'padding-end': 'webkit moz',
			'padding-start': 'webkit moz',
			'tab-size': 'webkit moz o',
			'text-size-adjust': 'webkit moz ms',
			'transform': 'webkit ms',
			'transform-origin': 'webkit ms',
			'transition': 'webkit moz o',
			'transition-delay': 'webkit moz o',
			'transition-duration': 'webkit',
			'transition-property': 'webkit',
			'transition-timing-function': 'webkit',
			'user-select': 'webkit moz ms'
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

		parser.addListener('startrule', function () {
			properties = [];
		});

		parser.addListener('startkeyframes', function (event) {
			inKeyFrame = event.prefix || true;
		});

		parser.addListener('endkeyframes', function () {
			inKeyFrame = false;
		});

		parser.addListener('property', function (event) {
			var name = event.property;
			if (CSSLint.Util.indexOf(applyTo, name.text) > -1 || compatiblePrefixes[name.text]) {

				// e.g., -moz-transform is okay to be alone in @-moz-keyframes
				if (!inKeyFrame || typeof inKeyFrame !== 'string' ||
					name.text.indexOf('-' + inKeyFrame + '-') !== 0) {
					properties.push(name);
				}
			}
		});

		parser.addListener('endrule', function (event) {
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
				item;

			for (i = 0, len = properties.length; i < len; i++) {
				name = properties[i];

				for (prop in compatiblePrefixes) {
					if (compatiblePrefixes.hasOwnProperty(prop)) {
						variations = compatiblePrefixes[prop];
						if (variations.indexOf(prop) === -1) {
							variations.push(prop);	//for unprefixed version
						}

						if (CSSLint.Util.indexOf(variations, name.text) > -1 || name.text === prop) {
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
							if (CSSLint.Util.indexOf(actual, item) === -1) {
								if (missing.indexOf(item) === -1) {
									missing.push(item);
								} else if (missing.indexOf(actual[0])) {
									missing.push(actual[0]);
								}
							}
						}
						if (missing.length) {
							reporter.report(missing, value.actualNodes[0].line, value.actualNodes[0].col, rule, event.selectors[0].text);
						}
					}
				}
			}
		});
	}
})
;

/*
 * Rule: When using a vendor-prefixed gradient, make sure to use them all.
 */
CSSLint.addRule({

	//rule information
	id: 'gradients',
	name: 'Require all gradient definitions',
	desc: 'When using a vendor-prefixed gradient, make sure to use them all.',
	browsers: 'All',

	//initialization
	init: function (parser, reporter) {
		var rule = this,
			hasGradients,
			gradients;

		parser.addListener("startrule", function () {
			hasGradients = false;
			gradients = {
				webkit: 0 //Need to check the webkit prefix because of Android devices
			};
		});

		parser.addListener("property", function (event) {
			// register what types of gradients the selector has
			if (/(?:\-)?(webkit)?(?:\-)?(?:linear|radial)\-gradient/i.test(event.value)) {
				if (RegExp.$1) {
					gradients[RegExp.$1] = 1;
				} else {
					gradients.standard = 1;
				}
				hasGradients = true;
			} else {
				hasGradients = false;
			}
		});

		parser.addListener("endrule", function (event) {
			var missing = [];

			if (hasGradients === true && !gradients.standard) {
				missing.push("Missing standard gradient");
			}

			// if it has gradients but not all of the vendor-prefixes, report it
			if (missing.length && missing.length < 4) {
				reporter.report(missing, event.selectors[0].line, event.selectors[0].col, rule, event.selectors[0].text);
			}
		});
	}
});


var htmlEncode = function (encodedHtml) {
	if (typeof encodedHtml === 'undefined') {
		return null;
	}

	return encodedHtml.replace(/\//g, '%2F')
		.replace(/\?/g, '%3F')
		.replace(/\=/g, '%3D')
		.replace(/&/g, '%26')
		.replace(/@/g, '%40')
		.replace(/</g, '')
		.replace(/>/g, '');
};

var check = bluebird.method(function (website) {
	var test = {
		testName: 'cssprefixes',
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

		if (selectors.length > 0) {
			test.passed = false;
			test.data.push({
				cssFile: cssFile.cssUrl,
				selectors: selectors
			});
		}
	});

	return test;
});

module.exports.check = check;