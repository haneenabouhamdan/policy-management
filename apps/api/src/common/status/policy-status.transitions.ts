import { BadRequestException } from '@nestjs/common';
import { PolicyStatus } from '../../entities/policy-status.enum';

const ALLOWED: Record<PolicyStatus, readonly PolicyStatus[]> = {
  [PolicyStatus.DRAFT]: [PolicyStatus.ACTIVE, PolicyStatus.INACTIVE],
  [PolicyStatus.ACTIVE]: [PolicyStatus.INACTIVE],
  [PolicyStatus.INACTIVE]: [PolicyStatus.ACTIVE],
};

const REACTIVATE_REASON_MIN = 8;

export function assertStatusTransition(
  from: PolicyStatus,
  to: PolicyStatus,
  options?: { reason?: string },
): void {
  if (from === to) {
    throw new BadRequestException(`Policy is already ${to}`);
  }

  if (!ALLOWED[from].includes(to)) {
    throw new BadRequestException(
      `Cannot transition status from ${from} to ${to}`,
    );
  }

  if (from === PolicyStatus.INACTIVE && to === PolicyStatus.ACTIVE) {
    const reason = options?.reason?.trim() ?? '';
    if (reason.length < REACTIVATE_REASON_MIN) {
      throw new BadRequestException(
        'A reason is required to reactivate an inactive policy',
      );
    }
  }
}

export function getAllowedTransitions(from: PolicyStatus): PolicyStatus[] {
  return [...ALLOWED[from]];
}
