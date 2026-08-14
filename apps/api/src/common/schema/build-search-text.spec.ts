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

  it('skips data URLs and http image links', () => {
    expect(
      buildSearchText('Marina Apartment', {
        territory: 'UAE',
        photo: 'data:image/jpeg;base64,abc',
        listing: 'https://images.example.com/building.jpg',
        notes: 'waterfront apartment',
      }),
    ).toBe('marina apartment uae waterfront apartment');
  });
});
