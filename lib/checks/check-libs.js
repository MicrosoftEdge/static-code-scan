/**
 * Description: Check for most common libraries and frameworks to verify site is
 * using a version without known compatibility issues with IE9/10.
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

var Deferred = require('promised-io').Deferred;

function checkVersion(library, version) {
    var vinfo = {
        name: library.name,
        needsUpdate: true,
        minVersion: library.minVersions[0].major + library.minVersions[0].minor,
        version: version
    };
    if (library.patchOptional) {
        // If lib can have an implied ".0", add it when needed
        // match 1.17, 1.17b2, 1.17-beta2; not 1.17.0, 1.17.2, 1.17b2
        var parts = version.match(/^(\d+\.\d+)(.*)$/);
        if (parts && !/^\.\d+/.test(parts[2])) {
            version = parts[1] + ".0" + parts[2];
        }
    }
    for (var i = 0; i < library.minVersions.length; i++) {
        var gv = library.minVersions[i];
        if (version.indexOf(gv.major) === 0) {
            vinfo.minVersion = gv.major + gv.minor;
            vinfo.needsUpdate = +version.slice(gv.major.length) < +gv.minor;
            break;
        }
    }

    return vinfo;
}

var libraries = [
    {
        name: "jQuery",
        minVersions: [
            { major: "1.6.", minor: "4" },
            { major: "1.7.", minor: "2" },
            { major: "1.8.", minor: "2" },
            { major: "1.9.", minor: "1" },
            { major: "1.10.", minor: "2" },
            { major: "2.0.", minor: "3" }
        ],
        patchOptional: true,
        check: function (scriptText) {
            var version = scriptText.match(/jquery:\s*"([^"]+)/);
            return version && checkVersion(this, version[1]);
        }
    },
    {
        name: "jQuery UI",
        minVersions: [
            { major: "1.8.", minor: "24" },
            { major: "1.9.", minor: "2" },
            { major: "1.10.", minor: "3" }
        ],
        check: function (scriptText) {
            var version = scriptText.match(/\.ui,[\s\r\n]*\{[\s\r\n]*version:\s*"([^"]+)/m);
            return version && checkVersion(this, version[1]);
        }
    },
    {
        name: "Prototype",
        minVersions: [
            { major: "1.7.", minor: "1" }
        ],
        check: function (scriptText) {
            var version = scriptText.match(/Prototype JavaScript framework, version (\d+\.\d+\.\d+)/m);
            return version && checkVersion(this, version[1]);
        }
    },
    {
        name: "Dojo",
        minVersions: [
            { major: "1.5.", minor: "2" },
            { major: "1.6.", minor: "1" },
            { major: "1.7.", minor: "3" },
            { major: "1.8.", minor: "0" }
        ],
        check: function (scriptText) {
            var version = scriptText.match(/\.version\s*=\s*\{\s*major:\s*(\d+)\D+(\d+)\D+(\d+)/m);
            return version && checkVersion(this, version[1] + "." + version[2] + "." + version[3]);
        }
    },
    {
        name: "Mootools",
        minVersions: [
            { major: "1.2.", minor: "6" },
            { major: "1.4.", minor: "5" }
        ],
        check: function (scriptText) {
            var version = scriptText.match(/this.MooTools\s*=\s*\{version:\s*'(\d+\.\d+\.d+)/m);
            return version && checkVersion(this, version[1]);
        }
    },
    {
        name: "SWFObject",
        minVersions: [
            { major: "2.", minor: "2" }
        ],
        check: function (scriptText) {
            var version = scriptText.match(/\*\s+SWFObject v(\d+\.\d+)/m);
            return version && checkVersion(this, version[1]);
        }
    },
    {
        name: "jQuery Form Plugin",
        minVersions: [
            { major: "3.", minor: "22" }
        ],
        check: function (scriptText) {
            var version = scriptText.match(/Form Plugin\s+\*\s+version: (\d+\.\d+)/m);
            return version && checkVersion(this, version[1]);
        }
    },
    {
        name: "Modernizr",
        minVersions: [
            { major: "2.5.", minor: "2" },
            { major: "2.6.", minor: "2" }
        ],
        check: function (scriptText) {
            // Static analysis. :(  The version is set as a local variable, far from
            // where Modernizr._version is set. Just see if we have a commment header.
            // ALT: look for /VAR="1.2.3"/ then for /._version=VAR/ ... ugh.
            var version = scriptText.match(/\*\s*Modernizr\s+(\d+\.\d+\.d+)/m);
            return version && checkVersion(this, version[1]);
        }
    }
];

function checkScript(js, website) {
    var status = {
			passed: true,
			data: null
		};

    // See if this script has any of our known libraries
    for (var i = 0; i < libraries.length; i++) {
        var lib = libraries[i],
            result;

        if ( js.jsUrl !== "embed" ) {
            result = lib.check.call(lib, js.code || "");
            if ( result && result.needsUpdate ) {
                var pos = website.content.indexOf(js.jsUrl),
					lineNumber = website.content.substr(0, pos).split('\n').length;
                result.url = js.jsUrl;
                result.lineNumber = lineNumber;
                status.data = result;
				status.passed = false;
				break;
            }
        }
    }
    return status;
}

var check = function (website) {
    var deferred = new Deferred();

	// Let the main loop run before we do this work
	process.nextTick(function() {
        var test = {
				testName: "jslibs",
				url: website.url.href,
				passed: true,
				data: []
			},
			result;

		for (var i = 0; i < website.js.length; i++) {
			result = checkScript(website.js[i], website);

			if ( !result.passed ) {
				test.passed = false;
				test.data.push(result.data);
			}
		}

		deferred.resolve(test);
	});

    return deferred.promise;
};

module.exports.check = check;
