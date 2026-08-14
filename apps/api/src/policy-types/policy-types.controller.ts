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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user-role.enum';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { PolicyTypesService } from './policy-types.service';

@ApiTags('policy-types')
@ApiBearerAuth()
@Controller('policy-types')
export class PolicyTypesController {
  constructor(private readonly policyTypesService: PolicyTypesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  findAll() {
    return this.policyTypesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyTypesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  create(@Body() dto: CreatePolicyTypeDto) {
    return this.policyTypesService.create(dto);
  }
}
