const inquirer = require('inquirer');
const timestring = require('timestring');

const questions = [{
  type: 'confirm',
  name: 'use_enterprise',
  message: 'Do you want to create standups for a Github Enterprise username?'
},
{
  type: 'input',
  name: 'enterprise_url',
  message: 'Enter your enterprise url',
  default: 'https://api.github.ibm.com',
  when: function (answers) {
    return answers.use_enterprise;
  }
},
{
  type: 'input',
  name: 'enterprise_un',
  message: 'Github enterprise username:',
  validate: function (username) {
    let pass = false;
    if (username)
      pass = username.match(/^[a-zA-Z0-9_-]+$/);
    if (pass) {
      return true;
    }
    return 'Please enter a valid username';
  },
  when: function (answers) {
    return answers.use_enterprise;
  }

},
{
  type: 'password',
  name: 'enterprise_token',
  message: 'Enter the GitHub enterprise access token:',
  validate: function (token) {
    let pass = false;
    if (token)
      pass = token.match(/^[a-zA-Z0-9_-]+$/);
    if (pass) {
      return true;
    }
    return 'Please enter a valid token';
  },
  when: function (answers) {
    return answers.use_enterprise;
  }
},
{
  type: 'confirm',
  name: 'use_public',
  message: 'Do you want to create standups for a Github public username?',
  when: function (answers) {
    return answers.use_enterprise;
  }
},
{
  type: 'input',
  name: 'public_un',
  message: 'public Github username:',
  validate: function (username) {
    let pass = false;
    if (username)
      pass = username.match(/^[a-zA-Z0-9_-]+$/);
    if (pass) {
      return true;
    }
    return 'Please enter a valid username';
  },
  when: function (answers) {
    return answers.use_public || !answers.use_enterprise;
  }
},
{
  type: 'password',
  name: 'public_token',
  message: 'public GitHub access token:',
  validate: function (token) {
    let pass = false;
    if (token)
      pass = token.match(/^[a-zA-Z0-9_-]+$/);
    if (pass) {
      return true;
    }
    return 'Please enter a valid token';
  },
  when: function (answers) {
    return answers.use_public || !answers.use_enterprise;
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
    return 'Please enter a time frame lower than one week';
  }
}];

module.exports.prompt = () => inquirer.prompt(questions);