/**
 * Description: Test the doctype (Quirks) detection.
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

// Most of the test pages are from http://www.hixie.ch/tests/adhoc/compat/mozilla/001.cgi

"use strict";
var doctype = require('../lib/checks/check-rendermode.js'),
    url = require('url'),
    request = require('request'),
    testServer = require('../static/test-server.js'),
    testUrl = 'http://localhost:' + testServer.port + '/doctype-';

function doctypeTestMaker(page, wantResult, lineNumber) {
    return function (test) {
        var site = page.indexOf('http') === 0 ? page : testUrl + page;

        if (lineNumber) {
            test.expect(2);
        } else {
            test.expect(1);
        }

        request(site, function (error, response, content) {
            var website = {
                url: url.parse(site),
                content: content
            };
            doctype.check(website).then(function (result) {
                test.equal(result.passed, wantResult, site + ": wanted " +
                    (wantResult ? "Standards " : "Quirks ") + result.data.mode.join());
                if (lineNumber) {
                    test.ok(result.data.lineNumber === lineNumber, site + ": current lineNumber " +
                        result.data.lineNumber +
                        ' expected ' +
                        lineNumber);
                }
                test.done();
            });
        });
    };
}

module.exports['DocType'] = {
    'Standards mode: Any "DOCTYPE HTML SYSTEM"': doctypeTestMaker("http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+SYSTEM+%22http%3A%2F%2Fwww.w3.org%2FTR%2FREC-html40%2Fstrict.dtd%22%3E&MODE=full&EXPECT=standards%20mode",
        true, 1),
    'Standards mode: A DOCTYPE declaration without a DTD, i.e., <!DOCTYPE HTML>.': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: The public identifier "-//W3C//DTD HTML 4.01//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+4.01%2F%2FEN%22%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: The public identifier "-//W3C//DTD HTML 4.0//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+4.0%2F%2FEN%22%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: The public identifier "-//W3C//DTD XHTML 1.0 Strict//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+XHTML+1.0+Strict%2F%2FEN%22%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: The public identifier "ISO/IEC 15445:1999//DTD HyperText Markup Language//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22ISO%2FIEC+15445:1999%2F%2FDTD+HyperText+Markup+Language%2F%2FEN%22%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: The public identifier "ISO/IEC 15445:1999//DTD HTML//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22ISO%2FIEC+15445:1999%2F%2FDTD+HTML%2F%2FEN%22%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: Another public identifier "-//UNKNOWN//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FUNKNOWN%2F%2FEN%22%3E&MODE=full&EXPECT=standards%20mode',
        true),
    'Standards mode: "DOCTYPE HTML SYSTEM "about:legacy-compat"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+html+SYSTEM+%22about%3Alegacy-compat%22%3E&MODE=full',
        true),
    'Almost Standards mode: The public identifier "-//W3C//DTD XHTML 1.0 Transitional//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+XHTML+1.0+Transitional%2F%2FEN%22%3E&MODE=full&EXPECT=almost%20standards%20mode',
        true),
    'Almost Standards mode: The public identifier "-//W3C//DTD XHTML 1.0 Frameset//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+XHTML+1.0+Frameset%2F%2FEN%22%3E&MODE=full&EXPECT=almost%20standards%20mode',
        true),
    'Almost Standards mode: The public identifier "-//W3C//DTD HTML 4.01 Transitional//EN", with a system identifier': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+4.01+Transitional%2F%2FEN%22+%22http%3A%2F%2Fwww.w3.org%2FTR%2Fhtml4%2Floose.dtd%22%3E&MODE=full&EXPECT=almost%20standards%20mode',
        true),
    'Almost Standards mode: The public identifier "-//W3C//DTD HTML 4.01 Frameset//EN", with a system identifier': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+4.01+Frameset%2F%2FEN%22+%22http%3A%2F%2Fwww.w3.org%2FTR%2Fhtml4%2Fframeset.dtd%22%3E&MODE=full&EXPECT=almost%20standards%20mode',
        true),
	'Standards mode: A non-HTML SVG page': doctypeTestMaker('1.html', true),
    'Quirks mode: An XML declaration (pseudo-PI)': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%3Fxml+version%3D%221.0%22%3F%3E&MODE=full&EXPECT=quirks%20mode',
        false),
    'Quirks mode: The absence of a DOCTYPE': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=&MODE=full&EXPECT=quirks%20mode',
        false),
    'Quirks mode: A DOCTYPE declaration that cannot be understood (e.g., no matching quote)': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+NOT+UNDERSTOOD%3E&MODE=full&EXPECT=quirks%20mode',
        false),
    'Quirks mode: The public identifier "-//W3C//DTD HTML 4.01 Transitional//EN", without a system identifier': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+4.01+Transitional%2F%2FEN%22%3E&MODE=full&EXPECT=quirks%20mode',
        false),
    'Quirks mode: The public identifier "-//W3C//DTD HTML 4.01 Frameset//EN", without a system identifier': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+4.01+Frameset%2F%2FEN%22%3E&MODE=full&EXPECT=quirks%20mode',
        false),
    'Quirks mode: The public identifier "-//Microsoft//DTD Internet Explorer 3.0 HTML Strict//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FMicrosoft%2F%2FDTD+Internet+Explorer+3.0+HTML+Strict%2F%2FEN%22%3E&MODE=full&EXPECT=quirks%20mode',
        false),
    'Quirks mode: The public identifier "-//W3C//DTD HTML 3.2 Final//EN"': doctypeTestMaker('http://hixie.ch/tests/adhoc/compat/mozilla/001.cgi?DOCTYPE=%3C%21DOCTYPE+HTML+PUBLIC+%22-%2F%2FW3C%2F%2FDTD+HTML+3.2+Final%2F%2FEN%22%3E&MODE=full&EXPECT=quirks%20mode',
        false)
//    'Standards-HTML5': doctypeTestMaker("1.html", true, 1),
//    'Quirks-NoDoctype': doctypeTestMaker("2.html", false),
//    'Quirks-Unknown DocType': doctypeTestMaker("3.html", false),
//    'Standards-XHTML1-Strict': doctypeTestMaker("4.html", true),
//    'XHTML1-Transitional': doctypeTestMaker("5.html", true),
//    'HTML4.01 Transitional with system identifier': doctypeTestMaker("6.html", false)
    // 'Standards-XHTML1-Strict': doctypeTestMaker("http://www.aa.com", true),

    // 'Standards-HTML4-Transitional': doctypeTestMaker("http://www.dell.com", true, 1),
    // 'Quirks-doctype-not-first': doctypeTestMaker("http://www.rivals.com", false, 7),
    // 'Quirks-NoDoctype': doctypeTestMaker("http://juno.com", false)
};