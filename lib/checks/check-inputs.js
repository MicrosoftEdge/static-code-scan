/**
 * Description: Look for the presence of special types of inputs.
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

var $ = require('cheerio'),
	bluebird = require('bluebird'),
	inputTypes = ['color',
		'date',
		'datetime',
		'datetime-local',
		'email',
		'month',
		'number',
		'range',
		'reset',
		'search',
		'tel',
		'time',
		'url',
		'week'
	];

var check = bluebird.method(function (website) {
	//Removing the hidden type, we should probably remove other types too like password and so.
	var inputs = website.$('input[type!="hidden"]');

	var htmlInputs = inputs.filter(function () {
		var input = $(this);
		for (var i = 0, l = inputTypes.length; i < l; i++) {
			if (input.attr('type') && input.attr('type').toLowerCase() === inputTypes[i]) {
				return true;
			}
		}
		return false;
	});

	var passed = true;

	if (inputs.length > 0) {
		passed = htmlInputs.length > 0;
	}

	var test = {
		testName: 'inputTypes',
		passed: passed
	};

	return test;
});

module.exports.check = check;