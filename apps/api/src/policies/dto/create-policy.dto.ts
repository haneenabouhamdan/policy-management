import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePolicyDto {
  @IsUUID()
  typeId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsObject()
  @Type(() => Object)
  attributes!: Record<string, unknown>;
}
