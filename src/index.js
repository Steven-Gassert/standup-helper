// const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_TOKEN = '109ff1ad8c86c2175070cd32916b229f6d5d21f4';
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
 * @param {string} time_frame - length of time you would like to collect stats about, set to day if left empty
 */
function getEvents(params, callback) {
  const events = [];
  const username = 'lpatino10';
  const per_page = 100;
  const time_frame = 'week'; // will be default

  let page = 1;

  const dateNow = Date.now();
  //console.log(`The current time is ${dateNow}`);

  let time_frame_calculated;
  

  if (time_frame === 'week') {
    time_frame_calculated = Date.parse(new Date(new Date().getTime() - (60*60*24*10*1000))); // CHANGE BACK 
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
          result = includeEvent(event);
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

// will take event and return boolean include and {additional_info}
function includeEvent(event) {

  //console.log(`current event being checked is ${event.type}`);

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
            title: event.payload.pull_request.title,
            number: event.payload.pull_request.number,
            link: event.payload.pull_request.html_url
          }
        };
      } else {
        return {include: false, info: null};
      }

    // Commit parsing
    case ('PushEvent'):
      return {
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
    // return {include: false, info: null} for all the events we don't care about
    default:
      return {include: false, info: null}; 
  }
}

// takes all events that were included by includeEvent() and sorts them by repos. returns sorted_events json
function sort(events) {
  let sorted_events = {};

  events.forEach(event => {
    // add this repo if we don't have it listed in sorted_events yet
    if (!sorted_events[event.repo]){
      sorted_events[event.repo] = {
        issues: [],
        prs: [],
        commits: {}
      }
    }
    if (sorted_events[event.repo]) {
      if(event.type === 'Issue') {
        sorted_events[event.repo].issues.push(event);
      } else if (event.type === 'PR') {
        sorted_events[event.repo].prs.push(event);
      } else if (event.type === 'Commits') {
        // check if this ref exists in this commits obj
        if (sorted_events[event.repo].commits[event.ref]){
          sorted_events[event.repo].commits[event.ref] = sorted_events[event.repo].commits[event.ref] + event.size
        } else {
          sorted_events[event.repo].commits[event.ref] = event.size
        }
        //sorted_events[event.repo].commits.push(event);
      }
    }
  });

  return sorted_events;
}

// will be called only for the CLI
function print_sorted_events(sorted_events) {
  
  for (var repo in sorted_events) {
    console.log('');
    console.log(repo);
    if (sorted_events[repo].issues.length > 0) {
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
    // check to see if there were any commits in this repo
    if (Object.keys(sorted_events[repo].commits).length > 0) {
      console.log('   Commits:');
    }
    // print out commit info for every ref that's in the commit info section of this repo
    for (var ref in sorted_events[repo].commits) {
      console.log(`      pushed ${sorted_events[repo].commits[ref]} commits to ${ref}`);
    }
  }
}
