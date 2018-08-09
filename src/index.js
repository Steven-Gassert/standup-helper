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
  const repo = 'any'; // will be default
  const event_types = 'all'; // will be default
  // example of what event types would look like after being parsed
  /**
   * const event_types = {
   *  pr_open: true,
   *  pr_merged: true,
   *  pr_reviewed: false,
   *  commit: true,
   *  issue_opened: true,
   *  issue_closed: true,
   *  issue_commented: false
   * }
   */
  const time_frame = 'week'; // will be default
  const return_json = {};

  let page = 1;

  const dateNow = Date.now();
  console.log(`The current time is ${dateNow}`);

  let time_frame_calculated;
  

  if (time_frame === 'week') {
    time_frame_calculated = Date.parse(new Date(new Date().getTime() - (60*60*24*7*1000)));
    console.log(`The date a week ago was ${time_frame_calculated}`);
  } else {
    time_frame_calculated = Date.parse(new Date(new Date().getTime() - (60*60*24*1000)));
    console.log(`The date a day ago was ${time_frame_calculated}`);
  }

  const processEvents = (error, result) => {
    if (error) {
      return callback(error);
    }
    const data = result.data;
    console.log(`Processing ${data.length} events`);
    // process events
    let keepSearching = true;
    let correct_event_type = false;
    let message = null;
    data
      .filter(event => event.created_at) // not sure we need this filter
      .forEach(event => {
        const createdAt = Date.parse(event.created_at);
        if (createdAt >= time_frame_calculated) {
          correct_event_type, message = correctTypeOfEvent(event_types, event);
          if (correct_event_type) {
            console.log(`we want to add ${event} to our return json with message: ${message
            }`);
            // check to see if correct repo type,
          }
          // pseudo code for this section
          // if it is the correct type of event
          //    if it is contained within the correct repo
          //      call addevent, pass it the event and our return json
          //    else next
          // else next
          events.push(event); // gets deleted when pseudo code implemented
        } else {
          keepSearching = false;
        }
      });

    if (keepSearching) {
      page++;
      console.log(`${username} has ${events.length} events`);
      console.log(`Getting events for ${username}, page: ${page}`);
      octokit.activity.getEventsForUser({username, per_page, page }, processEvents);
    } else {
      callback(null, events);
    }
  };
  console.log(`Getting events for ${username}, page: ${page}`);
  octokit.activity.getEventsForUser({username, per_page, page }, processEvents);
}

getEvents(null, (err, events) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`We got ${events.length} events`);
    // events will be a JSON object in the future. we will parse this JSON object to be returned to either slack, github, terminal here?
  }
});

// will take event_types and event and return boolean correct_type and event_readable
function correctTypeOfEvent(event_types,event) {
  console.log(event.type);
  // check to see if it's a main event type
  switch (event.type) {
    // Pull request parsing
    case ('PullRequestEvent'):
      console.log("in pr switch block");
      // determine if we want to include this type of pull request event
      switch (event.payload.action) {
        case ('opened'):
          return true, 'Pull request opened';
        case ('edited'):
          return true, 'Pull request edited';
        case ('reopened'):
          return true, 'Pull request re-opened';
        case ('closed'):
          if (event.payload.pull_request.merged) {
            return true, 'Pull request merged';
          } else {
            return true, 'Pull request closed';
          }
        default:
          return false, null;
      }
    // Pull request review comment parsing
    case ('PullRequestReviewCommentEvent'):
    // determine if we want this type of Pull request comment event.
      console.log("inside pr review comment event");
      if (event.payload.action === 'created') {
        return true, 'commented on Pull request';
      } else {
        return false, null;
      }

    default:
      //console.log(event);
      return false;
    
  }
}
