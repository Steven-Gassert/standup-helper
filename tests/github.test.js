const github = require('../src/github');
describe('GitHub', function() {
  test('Should throw an error if no parameters are specified', () => {
    expect(() => {
      github();
    }).toThrow();
  });
});
