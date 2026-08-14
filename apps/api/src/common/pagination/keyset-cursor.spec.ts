import { decodePolicyCursor, encodePolicyCursor } from './keyset-cursor';

describe('policy list cursor', () => {
  it('round-trips updatedAt and id', () => {
    const updatedAt = new Date('2026-08-14T12:00:00.000Z');
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const encoded = encodePolicyCursor(updatedAt, id);
    expect(decodePolicyCursor(encoded)).toEqual({ updatedAt, id });
  });

  it('rejects malformed cursors', () => {
    expect(decodePolicyCursor('not-a-cursor')).toBeNull();
    expect(decodePolicyCursor('')).toBeNull();
  });
});
