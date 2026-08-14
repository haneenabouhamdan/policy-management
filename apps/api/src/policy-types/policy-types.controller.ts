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
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { PolicyTypeEventResponseDto } from './dto/policy-type-event-response.dto';
import { PolicyTypeResponseDto } from './dto/policy-type-response.dto';
import { UpdatePolicyTypeDto } from './dto/update-policy-type.dto';
import { PolicyTypesService } from './policy-types.service';

@ApiTags('policy-types')
@ApiBearerAuth()
@Controller('policy-types')
export class PolicyTypesController {
  constructor(private readonly policyTypesService: PolicyTypesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List policy types' })
  @ApiOkResponse({ type: [PolicyTypeResponseDto] })
  findAll(@CurrentUser() actor: AuthUser) {
    return this.policyTypesService.findAll(actor);
  }

  @Get(':id/events')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List schema and product edit history' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: [PolicyTypeEventResponseDto] })
  listEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.policyTypesService.listEvents(id, actor);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get a policy type by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PolicyTypeResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.policyTypesService.findOne(id, actor);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a policy type (ADMIN)' })
  @ApiCreatedResponse({ type: PolicyTypeResponseDto })
  create(@Body() dto: CreatePolicyTypeDto, @CurrentUser() actor: AuthUser) {
    return this.policyTypesService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Update a policy type (ADMIN). Schema changes bump schemaVersion.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PolicyTypeResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyTypeDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.policyTypesService.update(id, dto, actor);
  }
}
