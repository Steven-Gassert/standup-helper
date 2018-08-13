const GITHUB_TOKEN = '621c0c44e841de6ccf92158107d1dc3b933199ea';
const GITHUB_URL = 'https://api.github.com';


const octokit = require('@octokit/rest')({
  baseUrl: GITHUB_URL,
});

// token (https://github.com/settings/tokens)
octokit.authenticate({
  type: 'token',
  token: GITHUB_TOKEN,
});


/**
 * Gets the events from Github
 * @param {string} url - The Github URL
 * @param {string} token - The Github token
 * @param {function} callback - The callback
 * @param {string} repo - name of repository you would like to collect stats about, set to 'all' if left empty
 * @param {string} time_frame - length of time you would like to collect stats about, set to day if left empty
 * Add another param here for a json object which can indicate specifically which event types you would like (issues, prs, commits). Set to 'any' if left empty
 */
function getEvents(params, callback) {
  const events = [];
  const username = 'lpatino10';
  const per_page = 100;
  const repo = 'any'; // can add later? don't think we need to do this filtering, will we really have too many repos to look through?
  const event_types = 'all'; // can add later? don't think we need to do this filtering since we'll only have 3 event types by default
  const time_frame = 'week'; // will be default
  const return_json = {};

  let page = 1;

  const dateNow = Date.now();
  //console.log(`The current time is ${dateNow}`);

  let time_frame_calculated;
  

  if (time_frame === 'week') {
    time_frame_calculated = Date.parse(new Date(new Date().getTime() - (60*60*24*7*1000)));
    //console.log(`The date a week ago was ${time_frame_calculated}`);
  } else {
    time_frame_calculated = Date.parse(new Date(new Date().getTime() - (60*60*24*1000)));
    //console.log(`The date a day ago was ${time_frame_calculated}`);
  }

  const processEvents = (error, result) => {
    if (error) {
      return callback(error);
    }
    const data = result.data;

    // process events
    let keepSearching = true;
    let correct_event_type = false;
    let info = null;
    data
      .filter(event => event.created_at) // not sure we need this filter
      .forEach(event => {
        const createdAt = Date.parse(event.created_at);
        if (createdAt >= time_frame_calculated) {
          result = includeEvent(event_types, event);
          include = result.include;
          info = result.info;
          // if this is an event we want to include
          if (include) {
            //console.log(`we want to add ${event} to our return json with info: ${info}`);
            events.push(info);
          }
        } else {
          keepSearching = false;
        }
      });

    if (keepSearching) {
      page++;
      // console.log(`${username} has ${events.length} events`);
      // console.log(`Getting events for ${username}, page: ${page}`);
      octokit.activity.getEventsForUser({username, per_page, page }, processEvents);
    } else {
      callback(null, events);
    }
  };
  console.log(`Standup info for ${username}`);
  octokit.activity.getEventsForUser({username, per_page, page }, processEvents);
}

getEvents(null, (err, events) => {
  if (err) {
    console.log(err);
  } else {
    sorted_events = sort(events);
    //console.log(sorted_events);
    print_sorted_events(sorted_events);

  }
});

// will take event_types and event and return boolean include and additional_info
/**
 * CorrectType
 */
function includeEvent(params,event) {
  const show_commits = true // false will be default

  // console.log(event.type);
  switch (event.type) {
    // Pull request parsing
    case ('PullRequestEvent'):
      switch (event.payload.action) {
        case ('opened'):
          return {
            include: true,
            info: {
              type: 'PR',
              action: 'opened',
              repo: event.repo.name,
              title: event.payload.pull_request.title,
              number: event.payload.pull_request.number,
              link: event.payload.pull_request.html_url
            }
          };
        case ('reopened'):
          return {
            include: true,
            info: {
              type: 'PR',
              action: 're-opened',
              repo: event.repo.name,
              title: event.payload.pull_request.title,
              number: event.payload.pull_request.number,
              link: event.payload.pull_request.html_url
            }
          };
        case ('closed'):
          if (event.payload.pull_request.merged) {
            return {
              include: true,
              info: {
                type: 'PR',
                action: 'merged',
                repo: event.repo.name,
                title: event.payload.pull_request.title,
                number: event.payload.pull_request.number,
                link: event.payload.pull_request.html_url
              }
            };
          } else {
            return {include: false, info: null};
          }
        default:
          return {include: false, info: null};
      }
    case ('PullRequestReviewCommentEvent'):
      if (event.payload.action === 'created') {
        return {
          include: true,
          info: {
            type: 'PR',
            action: 'commented on',
            repo: event.repo.name,
            title: event.payload.pull_request.title,  // these feilds may be incorrect **double check**
            number: event.payload.pull_request.number,
            link: event.payload.pull_request.html_url
          }
        };
      } else {
        return {include: false, info: null};
      }
    // Commit parsing
    // will get a maximum of 20 commits in a single PushEvent (api limit)
    case ('PushEvent'):
    // change this all to reflect that this is a push (group of commits) rather than a 'commit'
      push_event_info = {
        include: true,
        info: {
          type: 'Commits',
          action: 'pushed',
          repo: event.repo.name,
          ref: event.payload.ref,
          size: event.payload.distinct_size, // size vs distinct size?
          date: event.created_at,
        }
      };
      if (show_commits) {
        push_event_info.info.commits = event.payload.commits;
      }
      return push_event_info;
    //Issue parsing
    case('IssuesEvent'):
      return {
        include: true,
        info: {
          type: 'Issue',
          action: event.payload.action,
          repo: event.repo.name,
          title: event.payload.issue.title,
          number: event.payload.issue.number,
          link: event.payload.issue.html_url
        }
      };

    default:
      return {include: false, info: null};
    
  }
}

// will take all included events and sort them into repos in a human readable mannor
function sort(events) {
  let sorted_events = {};

  events.forEach(event => {
    if (!sorted_events[event.repo]){
      // console.log(`${event.repo} doesn't exist yet, creating it!`);
      sorted_events[event.repo] = {
        issues: [],
        prs: [],
        commits: []
      }
    }
    if (sorted_events[event.repo]) {
      if(event.type === 'Issue') {
        sorted_events[event.repo].issues.push(event);
      } else if (event.type === 'PR') {
        sorted_events[event.repo].prs.push(event);
      } else if (event.type === 'Commits') {
        sorted_events[event.repo].commits.push(event);
      }
    }
  });

  return sorted_events;
}

function print_sorted_events(sorted_events) {
  
  for(var repo in sorted_events) {
    console.log('');
    console.log(repo);
    if(sorted_events[repo].issues.length > 0) {
      console.log('   Issues:')
      sorted_events[repo].issues.forEach(issue => {
        console.log(`      ${issue.action} Issue ${issue.number}: ${issue.link}`);
      });
    }
    if (sorted_events[repo].prs.length > 0) {
      console.log('   PRS:')
      sorted_events[repo].prs.forEach(pr => {
        console.log(`      ${pr.action} ${pr.title} (${pr.number}): ${pr.link}`);
      });
    }
    if (sorted_events[repo].commits.length > 0) {
      console.log('   Commits:');
      sorted_events[repo].commits.forEach(commits => {
        console.log(`      ${commits.action} ${commits.size} commits to ${commits.ref}`);
      });
    }
  }
}
