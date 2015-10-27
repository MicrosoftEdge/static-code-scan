#!/usr/bin/env node
'use strict';

var _ = require('lodash'),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    request = require('request'),
    app = require('../app.js'),
    Table = require('cli-table2');

var isWin = process.platform == 'win32';

var symbols = {
  'pass': isWin ? '\u221A' : '\u2713',
  'fail': isWin ? '\u00D7' : '\u2716'
};

var questions = [
  {
    'type': 'input',
    'name': 'url',
    'message': 'URL to scan',
    'filter': function(url) {
      if (/^\/{2}/i.test(url)) {
        return 'http:' + url;
      }
      if (!/^http/i.test(url)) {
	return 'http://' + url;
      }
      return url;
    },
    'validate': function(url) {
      return url.length >= 4 || 'Please enter a URL.';
    }
  },
  {
    'type': 'confirm',
    'name': 'username',
    'message': 'Is authentication required?',
    'default': false
  },
  {
    'type': 'input',
    'name': 'username',
    'message': 'Username',
    'when': _.property('username'),
    'validate': function(username) {
      return !!username.length || 'Please enter a username.';
    }
  },
  {
    'type': 'password',
    'name': 'password',
    'message': 'Password',
    'when': _.property('username'),
    'validate': function(password) {
      return !!password.length || 'Please enter a password.';
    }
  }
];

/*----------------------------------------------------------------------------*/

console.log('or follow the prompts below\n');

inquirer.prompt(questions, function(answers) {
  var message = 'Scanning ' + answers.url + '...\r';
  process.stdout.write(message);

  request.get({
    'url': 'http://localhost:' + app.port + '/',
    'qs': answers
  }, function(err, resp, body) {
    console.log(_.padRight('Scan complete.', message.length));

    body = JSON.parse(body);

    var yellow = chalk.yellow;

    var table = new Table({
      'head': ['Test', { 'hAlign': 'center', 'content': 'Status' }],
      'style': { 'head': ['cyan'], 'border': ['white'], 'padding-left': 2, 'padding-right': 2 },
      'colWidths': [80, 10]
    });

    _.forOwn(body.results, function(data) {
      var color = chalk[data.passed ? 'green' : 'red'],
          summary = JSON.stringify(data.data, null, '  '),
          symbol = symbols[data.passed ? 'pass' : 'fail'];

      table.push([color(data.testName), { 'hAlign': 'center', 'content': color(symbol) }]);

      if (!data.passed && !_.isEmpty(data.data)) {
        table.push([{ 'colSpan': 2, 'content': yellow(summary) }]);
      }
    });

    console.log(table.toString());
    process.exit(0);
  });
});
