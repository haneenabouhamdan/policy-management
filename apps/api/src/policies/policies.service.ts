import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildSearchText } from '../common/schema/build-search-text';
import { validateAttributes } from '../common/schema/attribute-validator';
import { escapeIlike } from '../common/search/escape-ilike';
import { assertStatusTransition } from '../common/status/policy-status.transitions';
import type { AuthUser } from '../auth/types/auth-user';
import { Policy } from '../entities/policy.entity';
import { PolicyEvent } from '../entities/policy-event.entity';
import { PolicyEventType } from '../entities/policy-event-type.enum';
import { PolicyStatus } from '../entities/policy-status.enum';
import { PolicyType } from '../entities/policy-type.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { ListPoliciesQueryDto } from './dto/list-policies-query.dto';
import {
  EMPTY_STATUS_COUNTS,
  type PolicySummaryDto,
} from './dto/policy-summary.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UpdatePolicyStatusDto } from './dto/update-policy-status.dto';

export type PaginatedPolicies = {
  data: Policy[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(Policy)
    private readonly policiesRepo: Repository<Policy>,
    @InjectRepository(PolicyType)
    private readonly policyTypesRepo: Repository<PolicyType>,
    @InjectRepository(PolicyEvent)
    private readonly eventsRepo: Repository<PolicyEvent>,
  ) {}

  async findAll(query: ListPoliciesQueryDto): Promise<PaginatedPolicies> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.policiesRepo
      .createQueryBuilder('policy')
      .select([
        'policy.id',
        'policy.typeId',
        'policy.name',
        'policy.status',
        'policy.schemaVersion',
        'policy.createdAt',
        'policy.updatedAt',
      ])
      .leftJoin('policy.type', 'type')
      .addSelect(['type.id', 'type.name'])
      .orderBy('policy.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.q?.trim()) {
      qb.andWhere(`policy.searchText ILIKE :q ESCAPE '\\'`, {
        q: `%${escapeIlike(query.q.trim().toLowerCase())}%`,
      });
    }

    if (query.typeId) {
      qb.andWhere('policy.typeId = :typeId', { typeId: query.typeId });
    }

    if (query.status) {
      qb.andWhere('policy.status = :status', { status: query.status });
    }

    if (query.staleSchema) {
      qb.andWhere('policy.schemaVersion < type.schemaVersion');
    }

    if (query.typeId && query.attrKey && query.attrValue?.trim()) {
      const attrValue = query.attrValue.trim();
      qb.andWhere(
        `(
          policy.attributes -> :attrKey @> CAST(:attrJson AS jsonb)
          OR policy.attributes ->> :attrKey = :attrValue
        )`,
        {
          attrKey: query.attrKey,
          attrJson: JSON.stringify(attrValue),
          attrValue,
        },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async summarize(): Promise<PolicySummaryDto> {
    const statusRows = await this.policiesRepo
      .createQueryBuilder('policy')
      .select('policy.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('policy.status')
      .getRawMany<{ status: PolicyStatus; count: string }>();

    const byStatus = { ...EMPTY_STATUS_COUNTS };
    for (const row of statusRows) {
      byStatus[row.status] = Number(row.count) || 0;
    }

    const byType = (
      await this.policiesRepo
        .createQueryBuilder('policy')
        .innerJoin('policy.type', 'type')
        .select('type.id', 'id')
        .addSelect('type.name', 'name')
        .addSelect('COUNT(*)', 'count')
        .groupBy('type.id')
        .addGroupBy('type.name')
        .orderBy('type.name', 'ASC')
        .getRawMany<{ id: string; name: string; count: string }>()
    ).map((row) => ({
      id: row.id,
      name: row.name,
      count: Number(row.count) || 0,
    }));

    const staleRow = await this.policiesRepo
      .createQueryBuilder('policy')
      .innerJoin('policy.type', 'type')
      .select('COUNT(*)', 'count')
      .where('policy.schemaVersion < type.schemaVersion')
      .getRawOne<{ count: string }>();

    return {
      total: byStatus.DRAFT + byStatus.ACTIVE + byStatus.INACTIVE,
      byStatus,
      byType,
      staleSchema: Number(staleRow?.count) || 0,
    };
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policiesRepo.findOne({
      where: { id },
      relations: { type: true },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    return policy;
  }

  async listEvents(policyId: string): Promise<PolicyEvent[]> {
    await this.findOne(policyId);
    return this.eventsRepo.find({
      where: { policyId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async create(dto: CreatePolicyDto, actor: AuthUser): Promise<Policy> {
    const type = await this.policyTypesRepo.findOne({
      where: { id: dto.typeId },
    });
    if (!type) {
      throw new NotFoundException(`Policy type ${dto.typeId} not found`);
    }

    const attributes = validateAttributes(type.schema, dto.attributes);
    const name = dto.name.trim();

    const policy = this.policiesRepo.create({
      typeId: type.id,
      name,
      status: PolicyStatus.DRAFT,
      attributes,
      schemaVersion: type.schemaVersion,
      searchText: buildSearchText(name, attributes),
    });

    const saved = await this.policiesRepo.save(policy);
    await this.recordEvent(saved.id, PolicyEventType.CREATED, actor, {
      name,
      typeId: type.id,
      schemaVersion: type.schemaVersion,
    });
    return this.findOne(saved.id);
  }

  async update(
    id: string,
    dto: UpdatePolicyDto,
    actor: AuthUser,
  ): Promise<Policy> {
    const policy = await this.findOne(id);
    const type = policy.type;
    const before = {
      name: policy.name,
      attributes: policy.attributes,
      schemaVersion: policy.schemaVersion,
    };

    if (dto.name !== undefined) {
      policy.name = dto.name.trim();
    }

    if (dto.attributes !== undefined) {
      if (!type) {
        throw new NotFoundException(`Policy type for policy ${id} not found`);
      }
      policy.attributes = validateAttributes(type.schema, dto.attributes);
      policy.schemaVersion = type.schemaVersion;
    }

    policy.searchText = buildSearchText(policy.name, policy.attributes);
    await this.policiesRepo.save(policy);
    await this.recordEvent(id, PolicyEventType.UPDATED, actor, {
      from: before,
      to: {
        name: policy.name,
        attributes: policy.attributes,
        schemaVersion: policy.schemaVersion,
      },
    });
    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    dto: UpdatePolicyStatusDto,
    actor: AuthUser,
  ): Promise<Policy> {
    const policy = await this.findOne(id);
    const from = policy.status;
    assertStatusTransition(from, dto.status);
    policy.status = dto.status;
    await this.policiesRepo.save(policy);
    await this.recordEvent(id, PolicyEventType.STATUS_CHANGED, actor, {
      from,
      to: dto.status,
    });
    return this.findOne(id);
  }

  private recordEvent(
    policyId: string,
    type: PolicyEventType,
    actor: AuthUser,
    payload: Record<string, unknown>,
  ) {
    return this.eventsRepo.save(
      this.eventsRepo.create({
        policyId,
        type,
        actorId: actor.id,
        actorEmail: actor.email,
        payload,
      }),
    );
  }
}
