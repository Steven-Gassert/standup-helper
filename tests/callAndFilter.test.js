const callAndFilter = require('../src/callAndFilter');
describe('callAndFilter no params', function() {
  test('Should throw an error if no parameters are specified', () => {
    expect(() => {
      callAndFilter();
    }).toThrow();
  });
});
