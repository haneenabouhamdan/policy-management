import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ZodError } from 'zod';
import { Not, Repository } from 'typeorm';
import type { AuthUser } from '../auth/types/auth-user';
import {
  parsePolicyTypeSchema,
  type PolicyTypeSchema,
} from '../common/schema/policy-schema';
import { summarizeSchemaChange } from '../common/schema/schema-diff';
import { PolicyType } from '../entities/policy-type.entity';
import { PolicyTypeEvent } from '../entities/policy-type-event.entity';
import { PolicyTypeEventType } from '../entities/policy-type-event-type.enum';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { UpdatePolicyTypeDto } from './dto/update-policy-type.dto';

@Injectable()
export class PolicyTypesService {
  constructor(
    @InjectRepository(PolicyType)
    private readonly policyTypesRepo: Repository<PolicyType>,
    @InjectRepository(PolicyTypeEvent)
    private readonly eventsRepo: Repository<PolicyTypeEvent>,
  ) {}

  async findAll(): Promise<PolicyType[]> {
    return this.policyTypesRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PolicyType> {
    const policyType = await this.policyTypesRepo.findOne({ where: { id } });
    if (!policyType) {
      throw new NotFoundException(`Policy type ${id} not found`);
    }
    return policyType;
  }

  async listEvents(typeId: string): Promise<PolicyTypeEvent[]> {
    await this.findOne(typeId);
    return this.eventsRepo.find({
      where: { typeId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async create(dto: CreatePolicyTypeDto, actor: AuthUser): Promise<PolicyType> {
    const schema = this.parseSchema(dto.schema);

    const existing = await this.policyTypesRepo.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Policy type name already exists');
    }

    const entity = this.policyTypesRepo.create({
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      schema,
      schemaVersion: 1,
    });

    const saved = await this.policyTypesRepo.save(entity);
    await this.recordEvent(saved.id, PolicyTypeEventType.CREATED, actor, {
      name: saved.name,
      schemaVersion: 1,
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpdatePolicyTypeDto,
    actor: AuthUser,
  ): Promise<PolicyType> {
    const policyType = await this.findOne(id);
    const fromName = policyType.name;
    const fromDescription = policyType.description;
    const fromSchema = policyType.schema;
    const fromVersion = policyType.schemaVersion;

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Product name is required');
      }
      const clash = await this.policyTypesRepo.findOne({
        where: { name, id: Not(id) },
      });
      if (clash) {
        throw new ConflictException('Policy type name already exists');
      }
      policyType.name = name;
    }

    if (dto.description !== undefined) {
      policyType.description = dto.description.trim() || null;
    }

    let schemaChanged = false;
    let change = {
      added: [] as string[],
      removed: [] as string[],
      changed: [] as string[],
    };
    if (dto.schema !== undefined) {
      const schema = this.parseSchema(dto.schema);
      if (!this.sameSchema(fromSchema, schema)) {
        change = summarizeSchemaChange(fromSchema, schema);
        policyType.schema = schema;
        policyType.schemaVersion += 1;
        schemaChanged = true;
      }
    }

    const nameChanged = policyType.name !== fromName;
    const descriptionChanged = policyType.description !== fromDescription;
    if (!schemaChanged && !nameChanged && !descriptionChanged) {
      return policyType;
    }

    const saved = await this.policyTypesRepo.save(policyType);

    if (schemaChanged) {
      await this.recordEvent(id, PolicyTypeEventType.SCHEMA_CHANGED, actor, {
        fromVersion,
        toVersion: saved.schemaVersion,
        ...change,
        name: nameChanged ? { from: fromName, to: saved.name } : undefined,
        description: descriptionChanged
          ? { from: fromDescription, to: saved.description }
          : undefined,
      });
    } else {
      await this.recordEvent(id, PolicyTypeEventType.UPDATED, actor, {
        schemaVersion: saved.schemaVersion,
        name: nameChanged ? { from: fromName, to: saved.name } : undefined,
        description: descriptionChanged
          ? { from: fromDescription, to: saved.description }
          : undefined,
      });
    }

    return saved;
  }

  private parseSchema(input: unknown): PolicyTypeSchema {
    try {
      return parsePolicyTypeSchema(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Invalid policy type schema',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.') || 'schema',
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  }

  private sameSchema(left: unknown, right: PolicyTypeSchema) {
    return JSON.stringify(this.parseSchema(left)) === JSON.stringify(right);
  }

  private recordEvent(
    typeId: string,
    type: PolicyTypeEventType,
    actor: AuthUser,
    payload: Record<string, unknown>,
  ) {
    return this.eventsRepo.save(
      this.eventsRepo.create({
        typeId,
        type,
        actorId: actor.id,
        actorEmail: actor.email,
        payload,
      }),
    );
  }
}
