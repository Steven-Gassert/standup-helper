const inquirer = require('inquirer');
const timestring = require('timestring');

const questions = [{
  type: 'confirm',
  name: 'is_enterprise',
  message: 'Do you want to use Github Enterprise?'
},
{
  type: 'input',
  name: 'url',
  message: 'Enter the GitHub URL',
  default: 'https://api.github.com',
  when: function (answers) {
    return answers.is_enterprise;
  }
},
{
  type: 'password',
  name: 'token',
  message: 'Enter the GitHub access token:',
  validate: function (username) {
    if (username)
      var pass = username.match(/^[a-zA-Z0-9_-]+$/);
    if (pass) {
      return true;
    }
    return 'Please enter a valid username';
  }
},
{
  type: 'input',
  name: 'hours',
  message: 'Enter the timeframe (default 1 day):',
  default: '1d',
  filter: function(value) {
    return timestring(value || '1d', 'h');
  },
  validate: function (value) {
    if (value > 0 && value < 169) {
      return true;
    }
    return 'Please enter a time frame lower than a week';
  }
},
{
  type: 'input',
  name: 'username',
  message: 'Github username:',
  validate: function (username) {
    if (username)
      var pass = username.match(/^[a-zA-Z0-9_-]+$/);
    if (pass) {
      return true;
    }
    return 'Please enter a valid username';
  }
},
];

module.exports.prompt = () => inquirer.prompt(questions);