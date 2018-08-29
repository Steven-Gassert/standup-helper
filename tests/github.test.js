const github = require('../src/github');
const eventStubs = require('./eventStubs');
describe('github no params should return an error', function () {
  test('Should throw an error if no parameters are specified', () => {
    expect(() => {
      github();
    }).toThrow();
  });
});

describe('Include Event parsing', function () {
  let eventOptions = {
    issues: true,
    pull_requests: true,
    commits: true
  };
  let config = {
    'is_enterprise': false,
    'token': 'fake_key',
    'hours': 24,
    'username': 'username',
    'url': 'www.com'
  };

  test('a PR comment Event passed to includeEvent should return true when \'pull_requests: true\' in eventOptions', function () {
    let prCommentEvent = eventStubs.prCommentEvent;
    let result = github(config).includeEvent(prCommentEvent, eventOptions);
    expect(result).toBeTruthy();
  });

  test('a PR closed event passed to includeEvent should return true when \'pull_requests: true\' in eventOptions', function () {
    let prClosedEvent = eventStubs.prClosedEvent;
    let result = github(config).includeEvent(prClosedEvent, eventOptions);
    expect(result).toBeTruthy();
  });

  test('a PR opened event passed to includeEvent should return true when \'pull_requests: true\' in eventOptions', function () {
    let prOpenedEvent = eventStubs.prOpenedEvent;
    let result = github(config).includeEvent(prOpenedEvent, eventOptions);
    expect(result).toBeTruthy();
  });

  test('a push event passed to includeEvent should return true when \'commits: true\' in eventOptions', () => {
    let pushEvent = eventStubs.pushEvent;
    let result = github(config).includeEvent(pushEvent, eventOptions);
    expect(result).toBeTruthy();
  });

  test('an Issues event passed to includeEvent should return true when \'issues: true\' in eventOptions', () => {
    let issuesEvent = eventStubs.issuesEvent;
    let result = github(config).includeEvent(issuesEvent, eventOptions);
    expect(result).toBeTruthy();
  });
});

describe('Sort repository', function () {
  test('calling sortEventsByRepository() with events should return an organized JSON object of events.', () => {
    let config = {
      'is_enterprise': false,
      'token': 'fake_key',
      'hours': 24,
      'username': 'username',
      'url': 'www.com'
    };
    let events = eventStubs.eventsExample1;
    let result = github(config).sortEventsByRepository(events);
    expect(result['watson-developer-cloud/python-sdk'].issues.length === 1);
    expect(result['watson-developer-cloud/python-sdk'].prs.length === 1);
    expect(Object.keys(result['watson-developer-cloud/python-sdk'].commits).length === 1);
  });
  test('calling sortEventsByRepository() with no events should return an empty dictionary', () => {
    let config = {
      'is_enterprise': false,
      'token': 'fake_key',
      'hours': 24,
      'username': 'username',
      'url': 'www.com'
    };
    let events = {};
    let result = github(config).sortEventsByRepository(events);
    expect(result).toEqual({});
  });
});