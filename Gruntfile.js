/*
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
module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        nodeunit: {
            all: ['test/**/*.js'],
            libs: ['test/**/checklibs*.js'],
            compat: ['test/**/compatlist*.js'],
            cssprefixes: ['test/**/cssprefixes*.js'],
            doctype: ['test/**/doctype*.js'],
            ie11tiles: ['test/**/ie11*.js'],
            pluginfree: ['test/**/pluginfree*.js'],
            rwd: ['test/**/responsive*.js'],
            touch: ['test/**/touch*.js'],
            pagination: ['test/**/pagination*.js'],
            input: ['test/**/input*.js'],
            browserdetection: ['test/**/browserdetection*.js'],
            preload: ['test/**/pre*.js'],
            auth: ['test/**/auth*.js'],
            altImg: ['test/**/alt*.js'],
            aria: ['test/**/aria*.js']
        },
        watch: {
            files: '<%= lint.files %>',
            tasks: 'jshint'
        },
        jshint: {
            files: [
                'grunt.js',
                'lib/**/*.js',
                'test/**/*.js'
            ],
            options: {
				strict: false,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                node: true,
				expr: true,
				smarttabs: true,
				trailing: true,
				unused: "vars",
                globals: {
                    setImmediate: true,
                    exports: true
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    // Default task.
    grunt.registerTask('default', ['jshint', 'nodeunit']);
};
