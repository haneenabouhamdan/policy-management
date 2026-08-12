import { BadRequestException } from '@nestjs/common';
import { PolicyStatus } from '../../entities/policy-status.enum';
import {
  assertStatusTransition,
  getAllowedTransitions,
} from './policy-status.transitions';

describe('policy status transitions', () => {
  it('allows draft to active', () => {
    expect(() =>
      assertStatusTransition(PolicyStatus.DRAFT, PolicyStatus.ACTIVE),
    ).not.toThrow();
  });

  it('allows active to inactive', () => {
    expect(() =>
      assertStatusTransition(PolicyStatus.ACTIVE, PolicyStatus.INACTIVE),
    ).not.toThrow();
  });

  it('blocks inactive to active', () => {
    expect(() =>
      assertStatusTransition(PolicyStatus.INACTIVE, PolicyStatus.ACTIVE),
    ).toThrow(BadRequestException);
  });

  it('blocks active to draft', () => {
    expect(() =>
      assertStatusTransition(PolicyStatus.ACTIVE, PolicyStatus.DRAFT),
    ).toThrow(BadRequestException);
  });

  it('returns allowed transitions for draft', () => {
    expect(getAllowedTransitions(PolicyStatus.DRAFT)).toEqual([
      PolicyStatus.ACTIVE,
      PolicyStatus.INACTIVE,
    ]);
  });
});
