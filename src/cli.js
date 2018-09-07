#!/usr/bin/env node
const Configstore = require('configstore');
const program = require('commander');
const pkg = require('../package.json');
const github = require('./github');
const output = require('./output');
const inquirer = require('./inquirer');
const updateNotifier = require('update-notifier');
const fs = require('fs')

 
updateNotifier({pkg}).notify();

const configStore = new Configstore(pkg.name, {
  url: 'https://api.github.com',
});


program
  .option('--init', `Initialize ${pkg.name}`)
  .option('-e, --github-enterprise', 'use enterprise Github URL')
  .option('-g, --github-public','use public Github URL')
  .option('-t, --time-frame [time]', 'The timeframe in hours')
  .option('-i, --issues', 'Include issues')
  .option('-p, --pull-requests', 'Include pull requests')
  .option('-c, --commits', 'Include commits')
  .option('-a, --token [token]', 'The GitHub access token')
  .option('-s, --save', 'overwrite your configurations with the current command line arguments')
  .version(pkg.version, '-v, --version')
  .parse(process.argv);

program.parse(process.argv);

if (program.init) {
  // if --init, we need to delete the old configuration file so that we will not have incorrect configurations
  configStore.clear();
  // Ask for the default parameters and save them in
  // ~/.config/configstore/standup-helper.json
  inquirer.prompt()
    .then((answers) => {
      console.log('Saving options into the configuration file');
      Object.keys(answers).forEach(k => configStore.set(k, answers[k]));
      answers.token = 'hidden';
      console.log(JSON.stringify(answers, null, 2));
    });
} else {
  // overwrite if save was passed
  if (program.save) {
    console.log('save flags here');
  } 

  const config = configStore.all;
  const settings = '';
  // if there are no options specified we will include all types of events.
  if (!program.issues && !program.pullRequests && !program.commits) {
    config.issues = true;
    config.pull_requests = true;
    config.commits = true;
  } else {
    config.issues = program.issues || false;
    config.commits = program.commits || false;
    config.pull_requests = program.pullRequests || false;
  }
  // if neither public or enterprise is set, we will include any url that is provided/saved.
  if(!program.useEnterprise && !program.usePublic) {
    if (config.public_un)
      config.usePublic = true;
    if (config.enterprise_un)
      config.useEnterprise = true;
  } else {
    config.useEnterprise = program.useEnterprise || false;
    config.usePublic = program.usePublic || false;
    // if the user specified the use of a specific account, we want to check we have a username specified
    if (program.useEnterprise && (!config.enterprise_un)) {
      throw new Error('You have specified the use of a Enterprise account but have no enterprise username in your config file. Please run `standup-helper --init` again');
    }  
    if (program.usePublic && (!config.public_un)) {
      throw new Error('You have specified the use of a Pubilc account but have no public username in your config file. Please run `standup-helper --init` again');
    }
  }


  config.hours = program.timeFrame || config.hours;
  config.token = program.token || config.token;


  if (config.usePublic){
    let options = {
      url: 'https://api.github.com',
      token: config.public_token,
      hours: config.hours,
      username: config.public_un,
      issues: config.issues,
      pull_requests: config.pull_requests,
      commits: config.commits
    };
    github(options).getActivity()
      .then(results => {
        //console.log(JSON.stringify(results));
        const cliMessage = output.cli(results);
        console.log('----------Public Git Hub standup----------');
        console.log(cliMessage);
      })
      .catch(error => {
        console.log('----------Public Git Hub standup----------');
        console.error(error);
      });
     
  }
  if (config.useEnterprise) {
    let options = {
      url: config.url,
      token: config.enterprise_token,
      hours: config.hours,
      username: config.enterprise_un,
      issues: config.issues,
      pull_requests: config.pull_requests,
      commits: config.commits
    };
    github(options).getActivity()
      .then(results => {
        //console.log(JSON.stringify(results));
        const cliMessage = output.cli(results);
        console.log('----------Enterprise Git Hub standup----------');
        console.log(cliMessage);
      })
      .catch(error => {
        console.log('----------Enterprise Git Hub standup----------');
        console.error(error);
      });
  }
}


