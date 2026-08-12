import { BadRequestException } from '@nestjs/common';
import { PolicyStatus } from '../../entities/policy-status.enum';

const ALLOWED: Record<PolicyStatus, readonly PolicyStatus[]> = {
  [PolicyStatus.DRAFT]: [PolicyStatus.ACTIVE, PolicyStatus.INACTIVE],
  [PolicyStatus.ACTIVE]: [PolicyStatus.INACTIVE],
  [PolicyStatus.INACTIVE]: [],
};

export function assertStatusTransition(
  from: PolicyStatus,
  to: PolicyStatus,
): void {
  if (from === to) {
    throw new BadRequestException(`Policy is already ${to}`);
  }

  if (!ALLOWED[from].includes(to)) {
    throw new BadRequestException(
      `Cannot transition status from ${from} to ${to}`,
    );
  }
}

export function getAllowedTransitions(from: PolicyStatus): PolicyStatus[] {
  return [...ALLOWED[from]];
}
