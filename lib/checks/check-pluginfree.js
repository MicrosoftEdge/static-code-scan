/**
 * Description: Looks for:
 *  1) Compatibility issues related to ActiveX plugins in the CV lists
 *  2) Any plugin or ActiveX control different than Flash or SVG
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
	$ = require('cheerio');

var initiate = function (website) {
	var test = {
		testName: 'pluginfree',
		passed: true,
		data: []
	};

	var removeItems = function (original, itemsToRemove) {
		var cleaned = [],
			remove;
		for (var i = 0; i < original.length; i++) {
			remove = true;
			for (var j = 0; j < itemsToRemove.length; j++) {
				if (original[i] === itemsToRemove[j]) {
					remove = false;
					break;
				}
			}
			if (remove) {
				cleaned.push(original[i]);
			}
		}

		return cleaned;
	};

	return cvlist.getList()
		.then(function (list) {
			var resultWebsite = list[website.url.hostname.replace('-', '_').replace('www.', '')];
			if (resultWebsite && (resultWebsite.noFlash || (resultWebsite.featureSwitch && resultWebsite.featureSwitch === 'requiresActiveX:true'))) {
				test.passed = false;
				test.data = {activex: !resultWebsite.noFlash, cvlist: true};
			} else {
				var $objects = website.$('object'),
					$embeds = website.$('embed'),
					$objectParams = website.$('object param[value*=swf]'),
					$objectSWFparams = website.$('object[data*=swf]'),
					$objectSVGparams = website.$('object[data*=svg]'),
					$embedsSWF = website.$('embed[src*=swf]'),
					$embedsSVG = website.$('embed[src*=svg]');

				var activeXcontrols = $objects.length - $objectParams.length - $objectSWFparams.length - $objectSVGparams.length + $embeds.length - $embedsSWF.length - $embedsSVG.length;
				if (activeXcontrols > 0) {
					var endPoint, lines,
						objectsToRemove = $objectParams.toArray().concat($objectSWFparams.toArray(), $objectSVGparams.toArray()),
						embedsToRemove = $embedsSWF.toArray().concat($embedsSVG.toArray()),
						uniqueObjects = removeItems($objects, objectsToRemove),
						uniqueEmbeds = removeItems($embeds, embedsToRemove),
						objectHtml = $.html($(uniqueObjects[0])),
						embedHtml = $.html($(uniqueEmbeds[0])),
						objectRegex = new RegExp(objectHtml, 'gi'),
						embedRegex = new RegExp(embedHtml, 'gi'),
						matches;

					if (objectHtml !== '') {
						matches = objectRegex.exec(website.content);
						if (matches && matches.length > 0) {
							endPoint = website.content.indexOf(matches[0]);
						}
					} else {
						if (embedHtml !== '') {
							matches = embedRegex.exec(website.content);
							if (matches && matches.length > 0) {
								endPoint = website.content.indexOf(matches[0]);
							}
						}
					}

					lines = website.content.substr(0, endPoint)
						.split('\n').length;

					test.passed = false;
					test.data = {activex: true, cvlist: false, lineNumber: lines};
				}
			}

			return test;
		});
};

module.exports.check = initiate;