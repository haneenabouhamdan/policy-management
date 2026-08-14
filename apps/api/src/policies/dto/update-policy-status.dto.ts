import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PolicyStatus } from '../../entities/policy-status.enum';

export class UpdatePolicyStatusDto {
  @ApiProperty({
    enum: PolicyStatus,
    example: PolicyStatus.ACTIVE,
    description:
      'Allowed: DRAFT→ACTIVE|INACTIVE, ACTIVE→INACTIVE, INACTIVE→ACTIVE (reason required)',
  })
  @IsEnum(PolicyStatus)
  status!: PolicyStatus;

  @ApiPropertyOptional({
    example: 'Cover reinstated after outstanding premium paid',
    description: 'Required when reactivating an inactive policy',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
