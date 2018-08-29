const output = require('../src/output');

describe('output', () => {

  test('should handle when there are no events', () => {
    expect(output.cli({})).toBe('');
  });

  test('should format the events as CLI', () => {
    const events = {
      'stevengassert94/standup-helper': {
        'issues': [],
        'prs': [{
          'type': 'PR',
          'action': 'commented on',
          'numTimes': 5,
          'repo': 'stevengassert94/standup-helper',
          'title': 'cli.js now calls and logs the result of github.js getActivity(). also added chalk coloring',
          'number': 6,
          'link': 'https://github.com/stevengassert94/standup-helper/pull/6'
        }],
        'commits': {}
      },
      'watson-developer-cloud/personality-insights-nodejs': {
        'issues': [],
        'prs': [{
          'type': 'PR',
          'action': 'merged',
          'repo': 'watson-developer-cloud/personality-insights-nodejs',
          'title': 'fix: handle RC services in manifest',
          'number': 169,
          'link': 'https://github.com/watson-developer-cloud/personality-insights-nodejs/pull/169'
        }],
        'commits': {
          'refs/heads/master': 1,
          'refs/heads/fix-app-push': 1
        }
      },
      'watson-developer-cloud/python-sdk': {
        'issues': [],
        'prs': [{
          'type': 'PR',
          'action': 'commented on',
          'numTimes': 1,
          'repo': 'watson-developer-cloud/python-sdk',
          'title': 'new(WS): web socket-client library for STT weboscket',
          'number': 540,
          'link': 'https://github.com/watson-developer-cloud/python-sdk/pull/540'
        }],
        'commits': {}
      }
    };
    expect(output.cli(events)).toContain('made 5 comments on cli.js now calls and logs the result of github.js')
    expect(output.cli(events)).toContain('merged fix: handle RC services in manifest (169): https://github.com/watson-developer-cloud/personality-insights-nodejs/pull/169')
    expect(output.cli(events)).toContain('pushed 1 commits to refs/heads/master')
    expect(output.cli(events)).toContain('pushed 1 commits to refs/heads/fix-app-push')
    expect(output.cli(events)).toContain('watson-developer-cloud/personality-insights-nodejs')
    expect(output.cli(events)).toContain('watson-developer-cloud/python-sdk')
    expect(output.cli(events)).toContain('comment on new(WS): web socket-client library for STT weboscket (540): https://github.com/watson-developer-cloud/python-sdk/pull/540')
  });
});
