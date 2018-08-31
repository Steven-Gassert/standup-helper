#!/usr/bin/env node
const Configstore = require('configstore');
const program = require('commander');
const pkg = require('../package.json');
const github = require('./github');
const output = require('./output');
const inquirer = require('./inquirer');
const updateNotifier = require('update-notifier');
 
updateNotifier({pkg}).notify();

const configStore = new Configstore(pkg.name, {
  url: 'https://api.github.com',
});


program
  .version(pkg.version, '-v, --version')
  .option('--init', `Initialize ${pkg.name}`)
  .option('-i, --issues', 'Include issues')
  .option('-p, --pull-requests', 'Include pull requests')
  .option('-c, --commits', 'Include commits')
  .option('-t, --time-frame [time]', 'The timeframe in hours')
  .option('-g, --github-url [url]', 'The GitHub URL', 'https://api.github.com')
  .option('-a, --token [token]', 'The GitHub access token')
  .parse(process.argv);

program.parse(process.argv);

if (program.init) {
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
  const config = configStore.all;
  // if there are no options specified we will include all types of events.
  if (!program.issues && !program.pullRequests && !program.commits){
    config.issues = true;
    config.pull_requests = true;
    config.commits = true;
  } else {
    config.issues = program.issues || false;
    config.commits = program.commits || false;
    config.pull_requests = program.pullRequests || false;
  }
  config.hours = program.timeFrame || config.hours;
  config.url = program.githubUrl || config.url;
  config.token = program.token || config.token;

  github(config).getActivity()
    .then(results => {
      //console.log(JSON.stringify(results));
      const cliMessage = output.cli(results);
      console.log(cliMessage);
    })
    .catch(error => console.error(error));
}


