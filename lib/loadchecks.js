 /**
 * Description: Load all the tests ("checks") that are to be done in the scan.
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

var fs = require('fs'),
    tests = [],
    path = require('path');

    //path = process.cwd().indexOf('lib') !== -1 ? './checks/' : './lib/checks/';
fs.readdirSync(path.join(__dirname, 'checks')).forEach(function (file) {
    if (file.indexOf('check') === 0) {
        tests.push(require(path.join(__dirname, 'checks', file)));
    }
});

module.exports.tests = tests;