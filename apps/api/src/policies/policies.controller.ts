import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user-role.enum';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { ListPoliciesQueryDto } from './dto/list-policies-query.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UpdatePolicyStatusDto } from './dto/update-policy-status.dto';
import { PoliciesService } from './policies.service';

@ApiTags('policies')
@ApiBearerAuth()
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  findAll(@Query() query: ListPoliciesQueryDto) {
    return this.policiesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policiesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(@Body() dto: CreatePolicyDto) {
    return this.policiesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePolicyDto) {
    return this.policiesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyStatusDto,
  ) {
    return this.policiesService.updateStatus(id, dto);
  }
}
