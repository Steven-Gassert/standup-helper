const Chalk = require('chalk');

/**
 * Returns the string representation of the Github events.
 * @param {Array[object]} sortedEvents - A list of Github events.
 */
function cli(sortedEvents) {
  let ret = '';
  for (const repository in sortedEvents) {
    const events = sortedEvents[repository];
    ret += '\n';
    ret += Chalk.underline(repository) + '\n';
    if (events.issues.length > 0) {
      ret += '\t'+Chalk.bgRed('Issues\n');
      ret += events.issues.map(e => `\t\t${e.action} Issue ${e.number}: ${e.link}\n`);
    }
    if (events.prs.length > 0) {
      ret += '\t'+Chalk.inverse('Pull Requests\n');
      ret += events.prs.map(e => {
        // will add the correct `commented on` phrasing if there is a single comment or multiple comments
        if (e.action === 'commented on'){
          if (e.numTimes > 1) {
            return `\t\tmade ${e.numTimes} comments on ${e.title} (${e.number}): ${e.link}\n`;
          } else {
            return `\t\tcomment on ${e.title} (${e.number}): ${e.link}\n`;
          }
        } else {
          return `\t\t${e.action} ${e.title} (${e.number}): ${e.link}\n`;
        }
      });
    }
    // check to see if there were any commits in this repository
    if (Object.keys(events.commits).length > 0) {
      ret += '\t'+Chalk.bgBlue('Commits\n');
    }
    // print out commit info for every ref that's in the commit info section of this repository
    for (var ref in events.commits) {
      ret += `\t\tpushed ${events.commits[ref]} commits to ${ref}\n`;
    }
  }
  return ret;
}

/**
 * Returns the string representation of the Github events.
 * @param {Array[object]} sortedEvents - A list of Github events.
 */
function github(sortedEvents) {
  let ret = '';
  for (const repository in sortedEvents) {
    const events = sortedEvents[repository];
    ret += '\n';
    ret += Chalk.underline(repository) + '</br>\n';
    if (events.issues.length > 0) {
      ret += '\t'+Chalk.bgRed('Issues\n');
      ret += events.issues.map(e => `\t\t${e.action} Issue ${e.number}: ${e.link}\n`);
    }
    if (events.prs.length > 0) {
      ret += '\t'+Chalk.inverse('Pull Requests\n');
      ret += events.prs.map(e => {
        // will add the correct `commented on` phrasing if there is a single comment or multiple comments
        if (e.action === 'commented on'){
          if (e.numTimes > 1) {
            return `\t\tmade ${e.numTimes} comments on ${e.title} (${e.number}): ${e.link}\n`;
          } else {
            return `\t\tcomment on ${e.title} (${e.number}): ${e.link}\n`;
          }
        } else {
          return `\t\t${e.action} ${e.title} (${e.number}): ${e.link}\n`;
        }
      });
    }
    // check to see if there were any commits in this repository
    if (Object.keys(events.commits).length > 0) {
      ret += '\t'+Chalk.bgBlue('Commits\n');
    }
    // print out commit info for every ref that's in the commit info section of this repository
    for (var ref in events.commits) {
      ret += `\t\tpushed ${events.commits[ref]} commits to ${ref}\n`;
    }
  }
  return ret;
}

/**
 * Returns the string representation of the Github events.
 * @param {Array[object]} sortedEvents - A list of Github events.
 */
function slack(sortedEvents) {
  let ret = '';
  for (const repository in sortedEvents) {
    const events = sortedEvents[repository];
    ret += '\n';
    ret += repository + '\n';
    if (events.issues.length > 0) {
      ret += '\tIssues\n';
      ret += events.issues.map(e => `\t\t${e.action} Issue ${e.number}: ${e.link}\n`);
    }
    if (events.prs.length > 0) {
      ret += '\tPull Requests\n';
      ret += events.prs.map(e => {
        // will add the correct `commented on` phrasing if there is a single comment or multiple comments
        if (e.action === 'commented on'){
          if (e.numTimes > 1) {
            return `\t\tmade ${e.numTimes} comments on ${e.title} (${e.number}): ${e.link}\n`;
          } else {
            return `\t\tcomment on ${e.title} (${e.number}): ${e.link}\n`;
          }
        } else {
          return `\t\t${e.action} ${e.title} (${e.number}): ${e.link}\n`;
        }
      });
    }
    // check to see if there were any commits in this repository
    if (Object.keys(events.commits).length > 0) {
      ret += '\tCommits\n';
    }
    // print out commit info for every ref that's in the commit info section of this repository
    for (var ref in events.commits) {
      ret += `\t\tpushed ${events.commits[ref]} commits to ${ref}</br>`;
    }
  }
  return ret;
}

module.exports = {
  cli,
  github,
  slack
};