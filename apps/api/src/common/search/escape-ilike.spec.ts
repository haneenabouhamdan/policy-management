import { escapeIlike } from './escape-ilike';

describe('escapeIlike', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeIlike('100% cover_plan')).toBe('100\\% cover\\_plan');
  });
});
