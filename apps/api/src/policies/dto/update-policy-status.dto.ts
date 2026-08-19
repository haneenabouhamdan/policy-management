import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
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
    description:
      'Required (min 8 characters) when reactivating an inactive policy. If sent, must be 8–500 characters.',
    minLength: 8,
    maxLength: 500,
  })
  @ValidateIf(
    (dto: UpdatePolicyStatusDto) =>
      dto.reason != null && String(dto.reason).length > 0,
  )
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  reason?: string;
}
