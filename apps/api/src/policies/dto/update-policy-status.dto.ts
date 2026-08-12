import { IsEnum } from 'class-validator';
import { PolicyStatus } from '../../entities/policy-status.enum';

export class UpdatePolicyStatusDto {
  @IsEnum(PolicyStatus)
  status!: PolicyStatus;
}
