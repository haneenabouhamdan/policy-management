import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ZodError } from 'zod';
import { Repository } from 'typeorm';
import { parsePolicyTypeSchema } from '../common/schema/policy-schema';
import { PolicyType } from '../entities/policy-type.entity';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';

@Injectable()
export class PolicyTypesService {
  constructor(
    @InjectRepository(PolicyType)
    private readonly policyTypesRepo: Repository<PolicyType>,
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

  async create(dto: CreatePolicyTypeDto): Promise<PolicyType> {
    let schema;
    try {
      schema = parsePolicyTypeSchema(dto.schema);
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

    return this.policyTypesRepo.save(entity);
  }
}
