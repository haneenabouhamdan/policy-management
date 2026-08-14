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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '../entities/user-role.enum';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { ListPoliciesQueryDto } from './dto/list-policies-query.dto';
import { PolicyEventResponseDto } from './dto/policy-event-response.dto';
import {
  PaginatedPoliciesResponseDto,
  PolicyResponseDto,
} from './dto/policy-response.dto';
import { PolicySummaryDto } from './dto/policy-summary.dto';
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
  @ApiOperation({ summary: 'Search and list policies' })
  @ApiOkResponse({ type: PaginatedPoliciesResponseDto })
  findAll(@Query() query: ListPoliciesQueryDto) {
    return this.policiesService.findAll(query);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Book-of-business counts by status and product' })
  @ApiOkResponse({ type: PolicySummaryDto })
  summarize() {
    return this.policiesService.summarize();
  }

  @Get(':id/events')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List recent activity for a policy' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: [PolicyEventResponseDto] })
  listEvents(@Param('id', ParseUUIDPipe) id: string) {
    return this.policiesService.listEvents(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get a policy by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PolicyResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policiesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a draft policy' })
  @ApiCreatedResponse({ type: PolicyResponseDto })
  create(@Body() dto: CreatePolicyDto, @CurrentUser() actor: AuthUser) {
    return this.policiesService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update policy name or attributes' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PolicyResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.policiesService.update(id, dto, actor);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Transition policy status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PolicyResponseDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.policiesService.updateStatus(id, dto, actor);
  }
}
