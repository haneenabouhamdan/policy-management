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
import { UserRole } from '../entities/user-role.enum';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { PolicyTypeResponseDto } from './dto/policy-type-response.dto';
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
  findAll() {
    return this.policyTypesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.UNDERWRITER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get a policy type by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PolicyTypeResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyTypesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a policy type (ADMIN)' })
  @ApiCreatedResponse({ type: PolicyTypeResponseDto })
  create(@Body() dto: CreatePolicyTypeDto) {
    return this.policyTypesService.create(dto);
  }
}
