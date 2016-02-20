/*
 * Modern.IE main service; runs under node.js.
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

var url = require('url'),
	fs = require('fs'),
	port = process.env.PORT || 1337,
	requester = require('./lib/requester.js'),
	express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cheerio = require('cheerio'),
//promises = require('promised-io/promise'),
//Deferred = require('promised-io').Deferred,
//promised = require('promised-io/promise'),
	bluebird = require('bluebird'),
	cssLoader = require('./lib/loadcss.js'),
	jsLoader = require('./lib/loadjs.js'),
	tests = require('./lib/loadchecks.js').tests,
//http = require('http'),
	path = require('path'),
	zlib = require('zlib'),
	sanitize = require('validator').sanitize,
	charset = 'utf-8',
	querystring = require('querystring'),
	version = JSON.parse(fs.readFileSync('package.json')).version;

/**
 * Serializes a test results array and sends it via the response
 * @param {object} res The response to use to send the results
 * @param {Timestamp} start The start timestamp
 * @param {Array} resultsArray The results of all the tests
 * */
var sendResults = function (res, start, resultsArray) {
	var results = {};

	for (var i = 0; i < resultsArray.length; i++) {
		results[resultsArray[i].testName] = resultsArray[i];
	}
	res.writeHeader(200, {
		'Content-Type': 'application/json',
		'X-Content-Type-Options': 'nosniff'
	});
	res.write(JSON.stringify({
		version: version,
		url: {uri: (this && this.url && this.url.href) || 'http://private'},
		processTime: (Date.now() - start) / 1000,
		results: results
	}));
	res.end();
};

/**
 * Responds with a bad request error
 * */
var sendBadRequest = function (res) {
	res.writeHeader(400, {'Content-Type': 'text/plain'});
	res.write('Your package is malformed' + '\n');
	res.end();
};

/**
 * Responds with an internal server error
 * */
var sendInternalServerError = function (error, res) {
	res.writeHeader(500, {'Content-Type': 'text/plain'});
	res.write(JSON.stringify(error) + '\n');
	res.end();
};

/**
 * Responds with the error and message passed as parameters
 * */
var remoteErrorResponse = function (response, statusCode, message) {
	response.writeHead(200, {'Content-Type': 'application/json'});
	response.write(JSON.stringify({statusCode: statusCode, message: message}));
	response.end();
};

/**
 * Decompresses a byte array using the decompression method passed by type.
 * It supports gunzip and deflate
 * */
//var decompress = function (body, type) {
//	var deferred = new Deferred();
//
//	if (type === 'gzip') {
//		zlib.gunzip(body, function (err, data) {
//			if (!err) {
//				deferred.resolve({
//					body: data.toString(charset),
//					compression: 'gzip'
//				});
//			} else {
//				deferred.reject('Error found: can\'t gunzip content ' + err);
//			}
//		});
//	} else if (type === 'deflate') {
//		zlib.inflateRaw(body, function (err, data) {
//			if (!err) {
//				deferred.resolve({
//						body: data.toString(charset),
//						compression: 'deflate'
//					}
//				);
//			} else {
//				deferred.reject('Error found: can\'t deflate content' + err);
//			}
//		});
//	} else {
//		process.nextTick(function () {
//			deferred.reject('Unknown content encoding: ' + type);
//		});
//	}
//
//	return deferred.promise;
//};

/**
 * Launches and returns an array with the promises of all the non parallel tests
 * (browser detection, css prefixes, etc.)
 * */
var launchNonParallelTests = bluebird.method(function (promisesArray, website) {
	tests.forEach(function (test) {
		if (!test.parallel) {
			promisesArray.push(test.check(website));
		}
	});

	return bluebird.all(promisesArray);
});

/**
 * Since several tests need HTML/JS/CSS content, fetch it all at once
 * before calling any of the tests. Note that the tests still could
 * retrieve additional content async, since they return a promise.
 */
// function analyze(data, content, res) {
//     var start = Date.now(),
//         promisesTests = [];

//     var website = {
//         url: url.parse(data.uri),
//         auth: data.auth,
//         content: content.body,
//         compression: content.compression,
//         $: cheerio.load(content.body, { lowerCaseTags: true, lowerCaseAttributeNames: true })
//     };

//     tests.forEach(function (test) {
//         if (test.parallel) {
//             promisesTests.push(test.check(website));
//         }
//     });

//     cssLoader.loadCssFiles(website)
//         .then(jsLoader.loadjsFiles)
//         .then(launchNonParallelTests.bind(null, promisesTests))
//         .then(promises.all)
//         .then(sendResults.bind(website, res, start), sendInternalServerError.bind(website, res));
// }

/**
 * Gets the body of a pages and decompresses if needed
 * */
var getBody = function (request, website) {
	return request.getAsync(website.url)
		.then(function (result) {
			var res = result[0];
			var body = result[1];

			if (!body) {
				return bluebird.reject('Error found: Empty body');
			}

			website.url = url.parse(res.request.href); //In case there have been redirects
			if (res.headers['content-encoding']) {
				website.compression = res.headers['content-encoding'];
			}

			website.content = body.toString(charset);
			website.$ = cheerio.load(website.content, {lowerCaseTags: true, lowerCaseAttributeNames: true});
			return bluebird.resolve(website);
		});
};

/**
 * Returns the local scan page
 * */
var returnMainPage = function (response) {
	fs.readFile(path.join(__dirname, 'lib', 'index.html'), function (err, data) {
		if (!err) {
			response.writeHeader(200, {'Content-Type': 'text/html'});

		} else {
			response.writeHeader(500, {'Content-Type': 'text/plain'});
			data = 'Server error: ' + err + '\n';
		}
		response.write(data);
		response.end();
	});
};

var getDomain = function (req, res) {
	res.writeHeader(200, {'Content-Type': 'text/plain'});
	res.write(process.env.USERDOMAIN || process.env.USERDNSDOMAIN);
	res.end();
};

/**
 * Decides what action needs to be done: show the main page or analyze a website
 * */
var handleRequest = function (req, response) {
	if (req.url === '/') {
		// Return the "local scan" page
		returnMainPage(response);
		return;
	}

	var requestUrl = url.parse(req.url),
		parameters = querystring.parse(requestUrl.query),
		urlToAnalyze = sanitize(decodeURIComponent(parameters.url)).xss(),
		user = sanitize(decodeURIComponent(parameters.user)).xss(),
		password = sanitize(decodeURIComponent(parameters.password)).xss(),
		domain = sanitize(decodeURIComponent(parameters.domain)).xss(),
		auth;

	var website = {
		url: urlToAnalyze,
		auth: null, // We might not need this field
		$: null,
		content: '',
		compression: ''
	};

	var request;

	// If the request gave a user/pass, send it along. Wait for 401 response before sending passwords.
	if (user !== 'undefined' && password !== 'undefined') {
		auth = {
			'user': user,
			'pass': password,
			'sendImmediately': false
		};

		request = requester(auth);
		website.auth = auth;
		// request(urlToAnalyze,
		//     {auth: auth},
		//     processResponse(response, auth));
	} else {
		request = requester();
	}

	website.request = request;

	var start = Date.now(),
		promisesTests = [];

	tests.forEach(function (test) {
		if (test.parallel) {
			promisesTests.push(test.check(website));
		}
	});

	getBody(request, website)
		.then(function (web) {
			return cssLoader.loadCssFiles(web);
		})
		.then(function (web) {
			return jsLoader.loadjsFiles(web);
		})
		.then(function (web) {
			return launchNonParallelTests(promisesTests, web);
		})
		.then(function (results) {
			sendResults(response, start, results);
		})
		.catch(function (error) {
			sendInternalServerError(error, response);
		});
};

/**
 * Handles the content of a package sent via any of the plugins
 * */
var handlePackage = function (req, res) {
	if (!req.body.js || !req.body.css || !req.body.html || !req.body.url) {
		remoteErrorResponse(res, 400, 'Missing information');
	}
	var start = Date.now(),
		cssPromises = [],
		website;

	//TODO: try/catch this
	try {
		website = {
			url: req.body.url ? url.parse(req.body.url.replace(/"/g, '')) : 'http://privates.ite',
			content: req.body.html,
			css: null,
			js: JSON.parse(req.body.js),
			$: cheerio.load(req.body.html, {lowerCaseTags: true, lowerCaseAttributeNames: true})
		};
	} catch (e) {
		sendBadRequest(res);
		return;
	}

	var remoteCSS = JSON.parse(req.body.css);
	remoteCSS.forEach(function (parsedCSS) {
		if (parsedCSS.content !== '') {
			cssPromises.push(cssLoader.parseCSS(parsedCSS.content, parsedCSS.url, null, null, website));
		}
	});

	bluebird.all(cssPromises)
		.then(function (results) {
			var cssResults = [],
				promisesTests = [];

			cssResults.concat.apply(cssResults, results);
			website.css = cssResults;

			for (var i = 0; i < tests.length; i++) {
				// Call each test and save its returned promise
				promisesTests.push(tests[i].check(website));
			}

			bluebird.all(promisesTests)
				.then(sendResults.bind(null, res, start));
		});
};

// ## CORS middleware
//
// see: http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
var allowCrossDomain = function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'POST');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// intercept OPTIONS method
	if (req.method === 'OPTIONS') {
		res.send(204);
	}
	else {
		next();
	}
};
app.use(allowCrossDomain);

app.use(bodyParser.json());
app.get('/', handleRequest);
app.get('/domain', getDomain);
app.post('/package', handlePackage);
app.listen(port);

console.log('Server started on port ' + port);
console.log('To scan a private url go to http://localhost:' + port + '/ and follow the instructions');

module.exports.port = port;