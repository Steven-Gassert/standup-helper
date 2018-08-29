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
    var eventOptions = {
      issues: params.issues,
      pull_requests: params.pull_requests,
      commits: params.commits
    };

    // adjust last created at based on the user provided hours;
    lastCreatedAt.setHours(lastCreatedAt.getHours() - params.hours); // ? 


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
            const evt = includeEvent(event, eventOptions);
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
        octokit.activity.getEventsForUser({
          username,
          per_page,
          page
        }, processEvents);
      } else {
        resolve(events);
      }
    };
    octokit.activity.getEventsForUser({
      username,
      per_page,
      page
    }, processEvents);
  });
}

getEvents;

/**
 * Returns true if the event should be included in the response.
 * @param {Object} event - The Github event.
 * @returns {boolean} true if the event will be included in the response
 */
function includeEvent(event, eventOptions) { // is there a better way to do this without passing in params each time?
  if (!event || !event.type) {
    return false;
  } else {
    if (event.type === 'PullRequestEvent' && eventOptions.pull_requests) {
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
    } else if (event.type === 'PullRequestReviewCommentEvent' && eventOptions.pull_requests) {
      if (event.payload.action === 'created') {
        return {
          type: 'PR',
          action: 'commented on',
          numTimes: 1,
          repo: event.repo.name,
          title: event.payload.pull_request.title,
          number: event.payload.pull_request.number,
          link: event.payload.pull_request.html_url
        };
      } else {
        return null;
      }
    } else if (event.type === 'PushEvent' && eventOptions.commits) {
      return {
        type: 'Commits',
        action: 'pushed',
        repo: event.repo.name,
        ref: event.payload.ref,
        size: event.payload.distinct_size, // size vs distinct size?
        date: event.created_at,
      };
    } else if (event.type === 'IssuesEvent' && eventOptions.issues) {
      return {
        type: 'Issue',
        action: event.payload.action,
        repo: event.repo.name,
        title: event.payload.issue.title,
        number: event.payload.issue.number,
        link: event.payload.issue.html_url
      };
    }
  }
}

/**
 * Sorts events by repository.
 * @param {Array[object]} events - A list of Github events.
 */
function sortEventsByRepository(events) {
  const repositories = {};
  try{
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
  
      if (event.type === 'Issue') {
        repository.issues.push(event);
      } else if (event.type === 'PR') {
        if (event.action === 'commented on') {
          // incrementing the number of times a pr has been commented on if another comment already exists
          let commentEvent = repository.prs.find(prEvent => prEvent.action === 'commented on' && prEvent.title === event.title);
          if (commentEvent) {
            commentEvent.numTimes++;
          } else {
            repository.prs.push(event);
          }
        } else {
          repository.prs.push(event);
        }
      } else if (event.type === 'Commits') {
        // check if this ref exists in this commits obj
        if (repository.commits[event.ref]) {
          repository.commits[event.ref] = repository.commits[event.ref] + event.size;
        } else {
          repository.commits[event.ref] = event.size;
        }
      }
    });
  } catch(error) {
    return repositories;
  }
  return repositories;
}



module.exports = (params = {}) => {
  const schema = Joi.object().keys({
    username: Joi.string().replace('-', '_').token().min(1).max(30).required(), // .token() requires the string be alphanumeric or an underscore. github currently allows usernames with alphanumberics and hyphens
    token: Joi.string().required(),
    url: Joi.string().required(),
    hours: Joi.number().integer().min(1).max(168).required(), // max 1 week = 168 hours
    is_enterprise: Joi.boolean().required(),
    issues: Joi.boolean(),
    pull_requests: Joi.boolean(),
    commits: Joi.boolean()
  });
  Joi.assert(params, schema);

  return {
    getActivity: () => getEvents(params).then((events) => {
      const sortedEvents = sortEventsByRepository(events);
      return Promise.resolve(sortedEvents);
    }),
    includeEvent: includeEvent,
    sortEventsByRepository: sortEventsByRepository
  };
};