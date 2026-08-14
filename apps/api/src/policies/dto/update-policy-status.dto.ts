import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PolicyStatus } from '../../entities/policy-status.enum';

export class UpdatePolicyStatusDto {
  @ApiProperty({
    enum: PolicyStatus,
    example: PolicyStatus.ACTIVE,
    description: 'Allowed: DRAFT→ACTIVE|INACTIVE, ACTIVE→INACTIVE',
  })
  @IsEnum(PolicyStatus)
  status!: PolicyStatus;
}
