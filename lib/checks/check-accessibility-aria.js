/**
 * Description: Looks for the absence of the alt attribute in images.
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

var bluebird = require('bluebird'),
	selectors = ['role',
		'aria-atomic',
		'aria-busy',
		'aria-controls',
		'aria-describedby',
		'aria-disabled',
		'aria-dropeffect',
		'aria-flowto',
		'aria-grabbed',
		'aria-haspopup',
		'aria-hidden',
		'aria-invalid',
		'aria-label',
		'aria-labelledby',
		'aria-live',
		'aria-owns',
		'aria-relevant',
		'aria-autocomplete',
		'aria-checked',
		'aria-expanded',
		'aria-level',
		'aria-multiline',
		'aria-multiselectable',
		'aria-orientation',
		'aria-pressed',
		'aria-readonly',
		'aria-required',
		'aria-selected',
		'aria-sort',
		'aria-valuemax',
		'aria-valuemin',
		'aria-valuenow',
		'aria-valuetext',
		'aria-activedescendant',
		'aria-posinset',
		'aria-setsize'],
	selector = '[' + selectors.join('], [') + ']';

var check = bluebird.method(function (website) {
	var passed = false,
		arias = website.$(selector);

	if (arias.length > 0) {
		passed = true;
	}

	var test = {
		testName: 'ariaTags',
		passed: passed,
		data: []
	};
	return test;
});


module.exports.check = check;