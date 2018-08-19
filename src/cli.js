#!/usr/bin/env node

const Configstore = require('configstore');
const program = require('commander');

const pkg = require('../package.json');
const inquirer = require('./inquirer');
const configStore = new Configstore(pkg.name, {
  url: 'https://api.github.com',
});

program
  .version(pkg.version, '-v, --version')
  .option('--init', `Initialize ${pkg.name}`)
  .option('-i, --issues', 'Include issues')
  .option('-p, --pull-requests', 'Include pull requests')
  .option('-c, --commits', 'Include commits')
  .option('-t, --timeframe', 'The timeframe in hours')
  .option('-g, --github-url [url]', 'The GitHub URL', 'https://api.github.com')
  .option('-a, --access-token [access_token]', 'The GitHub access token')
  .parse(process.argv);

program.parse(process.argv);

if (program.init) {
  // Ask for the default parameters and save them in
  // ~/.config/configstore/standup-helper.json
  inquirer.prompt()
    .then((answers) => {
      console.log('Saving options into the configuration file');
      console.log(JSON.stringify(answers, null, 2));
      Object.keys(answers).forEach(k => configStore.set(k, answers[k]));
    });
} else {
  console.log('Add support for calling github.js here');
}