/**
 * Description: Downloads the Microsoft CV lists, which we query during testing to see
 * if a website has to be run in compat mode or has any ActiveX/Flash issues.
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

var compatListUrlIE10 = "https://iecvlist.microsoft.com/ie10/1152921505002013023/iecompatviewlist.xml",
    compatListUrlIE9 = "http://ie9cvlist.ie.microsoft.com/ie9CompatViewList.xml",    
    fs = require('fs'),
    request = require('request'),
    xml2js = require('xml2js'),
    parser = new xml2js.Parser(),
    Deferred = require('promised-io').Deferred,
    ready,
    cvlist = {},
    cvlistFile = 'cvlists.json',
    creationStamp,
    expiration = 86400000; //1 day in milliseconds

request = request.defaults({
    jar: false,
    headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)'}});

function saveCVList() {
    var deferred = new Deferred();
    fs.writeFile(cvlistFile, JSON.stringify(cvlist), function(err) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getCompatListUrl(ieversion) {
    var cvlistUrl;
    switch (ieversion) {
        case 'ie10':
            cvlistUrl = compatListUrlIE10;
            break;
        case 'ie9':
            cvlistUrl = compatListUrlIE9;
            break;
        default:
            cvlistUrl = compatListUrlIE9;
            break;
    }
    return cvlistUrl;
}

function addExplicitFlashBlockedSites(result) {
    var array,
    domain;
    if (result.iecompatlistdescription && result.iecompatlistdescription.NoFlash) {
        array = result.iecompatlistdescription.NoFlash[0].domain;
        for (var i = 0; i < array.length; i++) {
            domain = array[i]._ || array[i];
            if (domain) {
                domain = domain.trim().replace('-', '_');
                if (cvlist[domain]) {
                    cvlist[domain].noFlash = true;
                } else {
                    cvlist[domain] = {
                        noFlash: true
                    };
                }
            }
        }
    }
}

function addExplicitFlashApprovalSites(result) {
    var array,
    domain;
    if (result.iecompatlistdescription && result.iecompatlistdescription.Flash) {
        array = result.iecompatlistdescription.Flash[0].domain;
        for (var i = 0; i < array.length; i++) {
            domain = array[i]._ || array[i];
            if (domain) {
                domain = domain.trim().replace('-', '_');
                if (cvlist[domain]) {
                    cvlist[domain].flash = true;
                } else {
                    cvlist[domain] = {
                        flash: true
                    };
                }
            }
        }
    }
}

function addCompatSites(ieversion, result) {
    var array = ieversion.indexOf('1') !== -1 ? result.iecompatlistdescription.domain : result.ie9compatlistdescription.domain;

    for (var i = 0; i < array.length; i++) {
        if (array[i]._) {
            cvlist[array[i]._.replace('-', '_')] = array[i].$;
        } else {
            cvlist[array[i]] = {};
        }
    }
}

function downloadCVlist(ieversion) {
    var deferred = new Deferred(),
        cvlistUrl = getCompatListUrl(ieversion);

    request(cvlistUrl, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            parser.parseString(body, function(err, result) {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                addCompatSites(ieversion, result);
                addExplicitFlashApprovalSites(result);
                addExplicitFlashBlockedSites(result);

                deferred.resolve(cvlist);
            });
        } else {
            deferred.resolve(cvlist);
        }
    });

    return deferred.promise;
}

function downloadCVlists() {
    var deferred = new Deferred();

    downloadCVlist('ie10')
        .then(function() {
            downloadCVlist('ie9');
        })
        .then(saveCVList).then(function() {
            deferred.resolve();
        });

    return deferred.promise;
}

function getList() {
    var deferred = new Deferred();
    ready = false;

    if (typeof cvlist === "object" && Object.keys(cvlist).length > 0 && Date.now() - creationStamp < expiration) {
        deferred.resolve(cvlist);
    } else {
        fs.exists(cvlistFile, function(exists) {
            if (exists) {
                fs.stat(cvlistFile, function(err, stats) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        if (Date.now() - stats.mtime.getTime() > expiration) {
                            downloadCVlists().then(function() {
                                deferred.resolve(cvlist);
                            }, function(err) {
                                deferred.reject(err);
                            });
                        } else {
                            cvlist = fs.readFile(cvlistFile, function(err, data) {
                                if (err) {
                                    cvlist = {};
                                    deferred.reject(err);
                                }

                                cvlist = JSON.parse(data);
                                deferred.resolve(cvlist);
                            });
                        }
                    }
                });
            } else {
                downloadCVlists().then(function() {
                    deferred.resolve(cvlist);
                }, function(err) {
                    deferred.reject(err);
                });
            }
        });
    }

    return deferred.promise;
}

module.exports.getList = getList;