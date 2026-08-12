import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { PolicyTypesService } from './policy-types.service';

@ApiTags('policy-types')
@Controller('policy-types')
export class PolicyTypesController {
  constructor(private readonly policyTypesService: PolicyTypesService) {}

  @Get()
  findAll() {
    return this.policyTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyTypesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  create(@Body() dto: CreatePolicyTypeDto) {
    return this.policyTypesService.create(dto);
  }
}
