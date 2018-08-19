const Joi = require('joi');

/**
 * Returns a promise that resolves with the Github events for a given user
 * @param {string} url - The Github URL
 * @param {string} token - The Github token
 * @param {number} hours - Number of hours go back in time when collecting stats
 */
function getEvents(params) {
  return new Promise((resolve, reject) => {
    const octokit = require('@octokit/rest')({
      baseUrl: params.url,
    });

    // token (https://github.com/settings/tokens)
    octokit.authenticate({
      type: 'token',
      token: params.token,
    });

    const events = [];
    const per_page = 100;
    const username = params.username;
    const lastCreatedAt = new Date();
    let page = 1;

    // adjust last created at based on the user provided hours;
    lastCreatedAt.setHours(lastCreatedAt.getHours() - params.hours);


    const processEvents = (error, result) => {
      if (error) {
        return reject(error);
      }
      const data = result.data;

      // process events
      let keepSearching = true;
      data
        .filter(event => event.created_at) // not sure we need this filter
        .forEach(event => {
          const createdAt = Date.parse(event.created_at);
          if (createdAt >= lastCreatedAt) {
            const evt = includeEvent(event);
            // if this is an event we want to include then `evt` won't be null
            if (evt) {
              events.push(evt);
            }
          } else {
            keepSearching = false;
          }
        });

      if (keepSearching) {
        page++;
        octokit.activity.getEventsForUser({ username, per_page, page }, processEvents);
      } else {
        resolve(events);
      }
    };
    octokit.activity.getEventsForUser({ username, per_page, page }, processEvents);
  });
}

getEvents;

/**
 * Returns true if the even should be included in the response.
 * @param {Object} event - The Github event.
 * @returns {boolean} true if the event will be included in the response
 */
function includeEvent(event) {
  if (!event || !event.type) {
    return false;
  }
  switch (event.type) {
  // Pull request parsing
  case ('PullRequestEvent'):
    switch (event.payload.action) {
    case ('opened'):
      return {
        type: 'PR',
        action: 'opened',
        repo: event.repo.name,
        title: event.payload.pull_request.title,
        number: event.payload.pull_request.number,
        link: event.payload.pull_request.html_url
      };
    case ('reopened'):
      return {
        type: 'PR',
        action: 're-opened',
        repo: event.repo.name,
        title: event.payload.pull_request.title,
        number: event.payload.pull_request.number,
        link: event.payload.pull_request.html_url
      };
    case ('closed'):
      if (event.payload.pull_request.merged) {
        return {
          type: 'PR',
          action: 'merged',
          repo: event.repo.name,
          title: event.payload.pull_request.title,
          number: event.payload.pull_request.number,
          link: event.payload.pull_request.html_url
        };
      } else {
        return null;
      }
    default:
      return null;
    }
  case ('PullRequestReviewCommentEvent'):
    if (event.payload.action === 'created') {
      return {
        type: 'PR',
        action: 'commented on',
        repo: event.repo.name,
        title: event.payload.pull_request.title,
        number: event.payload.pull_request.number,
        link: event.payload.pull_request.html_url
      };
    } else {
      return null;
    }

  // Commit parsing
  case ('PushEvent'):
    return {
      type: 'Commits',
      action: 'pushed',
      repo: event.repo.name,
      ref: event.payload.ref,
      size: event.payload.distinct_size, // size vs distinct size?
      date: event.created_at,
    };
  //Issue parsing
  case('IssuesEvent'):
    return {
      type: 'Issue',
      action: event.payload.action,
      repo: event.repo.name,
      title: event.payload.issue.title,
      number: event.payload.issue.number,
      link: event.payload.issue.html_url
    };
  // return {include: false, info: null} for all the events we don't care about
  default:
    return null;
  }
}

/**
 * Sorts events by repository.
 * @param {Array[object]} events - A list of Github event.
 */
function sortEventsByRepository(events) {
  const repositories = {};

  events.forEach(event => {
    // Add this repo if we don't have it listed in repositories yet
    if (!repositories[event.repo]) {
      repositories[event.repo] = {
        issues: [],
        prs: [],
        commits: {}
      };
    }

    const repository = repositories[event.repo];

    if(event.type === 'Issue') {
      repository.issues.push(event);
    } else if (event.type === 'PR') {
      repository.prs.push(event);
    } else if (event.type === 'Commits') {
      // check if this ref exists in this commits obj
      if (repository.commits[event.ref]) {
        repository.commits[event.ref] = repository.commits[event.ref] + event.size;
      } else {
        repository.commits[event.ref] = event.size;
      }
    }
  });

  return repositories;
}

/**
 * Returns the string representation of the Github events.
 * @param {Array[object]} eventsByRepository - A list of Github event.
 */
function toString(eventsByRepository) {
  let ret = '';
  for (const repository in eventsByRepository) {
    const events = eventsByRepository[repository];
    ret += '\n';
    ret += repository + '\n';
    if (events.issues.length > 0) {
      ret += '\tIssues\n';
      ret += events.issues.map(e => `\t\t${e.action} Issue ${e.number}: ${e.link}\n`);
    }
    if (events.prs.length > 0) {
      ret += '\tPull Requests\n';
      ret += events.prs.map(e => `\t\t${e.action} ${e.title} (${e.number}): ${e.link}\n`);
    }
    // check to see if there were any commits in this repository
    if (Object.keys(events.commits).length > 0) {
      ret += '\tCommits\n';
    }
    // print out commit info for every ref that's in the commit info section of this repository
    for (var ref in events.commits) {
      ret += `\t\tpushed ${events.commits[ref]} commits to ${ref}\n`;
    }
  }
  return ret;
}


module.exports = (params = {}) => {
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(1).max(30).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
    token: Joi.string().required(),
    url: Joi.string().required(),
    hours: Joi.number().integer().min(1).max(168).required() // max 1 week = 168 hours
  });
  Joi.assert(params, schema);

  return {
    getActivity: () => getEvents(params).then((events) => {
      const sortedEvents = sortEventsByRepository(events);
      const output = toString(sortedEvents);
      return Promise.resolve(output);
    })
  };
};
