import { buildSearchText } from './build-search-text';

describe('buildSearchText', () => {
  it('normalizes name and attributes', () => {
    expect(
      buildSearchText('Gulf Travel', {
        regions: ['UAE', 'GCC'],
        maxTripDays: 21,
      }),
    ).toBe('gulf travel uae gcc 21');
  });
});
