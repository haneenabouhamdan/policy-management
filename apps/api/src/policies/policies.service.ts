import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildSearchText } from '../common/schema/build-search-text';
import { validateAttributes } from '../common/schema/attribute-validator';
import { assertStatusTransition } from '../common/status/policy-status.transitions';
import { Policy } from '../entities/policy.entity';
import { PolicyStatus } from '../entities/policy-status.enum';
import { PolicyType } from '../entities/policy-type.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { ListPoliciesQueryDto } from './dto/list-policies-query.dto';
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
  ) {}

  async findAll(query: ListPoliciesQueryDto): Promise<PaginatedPolicies> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.policiesRepo
      .createQueryBuilder('policy')
      .leftJoin('policy.type', 'type')
      .addSelect(['type.id', 'type.name'])
      .orderBy('policy.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.q?.trim()) {
      qb.andWhere('policy.searchText ILIKE :q', {
        q: `%${query.q.trim().toLowerCase()}%`,
      });
    }

    if (query.typeId) {
      qb.andWhere('policy.typeId = :typeId', { typeId: query.typeId });
    }

    if (query.status) {
      qb.andWhere('policy.status = :status', { status: query.status });
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

  async create(dto: CreatePolicyDto): Promise<Policy> {
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
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdatePolicyDto): Promise<Policy> {
    const policy = await this.findOne(id);
    const type = policy.type;

    if (dto.name !== undefined) {
      policy.name = dto.name.trim();
    }

    if (dto.attributes !== undefined) {
      policy.attributes = validateAttributes(type.schema, dto.attributes);
      policy.schemaVersion = type.schemaVersion;
    }

    policy.searchText = buildSearchText(policy.name, policy.attributes);
    await this.policiesRepo.save(policy);
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdatePolicyStatusDto): Promise<Policy> {
    const policy = await this.findOne(id);
    assertStatusTransition(policy.status, dto.status);
    policy.status = dto.status;
    await this.policiesRepo.save(policy);
    return this.findOne(id);
  }
}
