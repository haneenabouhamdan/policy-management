import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Policy } from '../entities/policy.entity';
import { PolicyStatus } from '../entities/policy-status.enum';
import { PolicyType } from '../entities/policy-type.entity';
import { PoliciesService } from './policies.service';

describe('PoliciesService', () => {
  const policyTypesRepo = {
    findOne: jest.fn(),
  };

  const policiesRepo = {
    create: jest.fn((value: Partial<Policy>) => value),
    save: jest.fn((value: Partial<Policy>) =>
      Promise.resolve({ ...value, id: 'policy-1' }),
    ),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  let service: PoliciesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: getRepositoryToken(Policy), useValue: policiesRepo },
        { provide: getRepositoryToken(PolicyType), useValue: policyTypesRepo },
      ],
    }).compile();

    service = module.get(PoliciesService);
  });

  it('creates a draft policy with validated attributes', async () => {
    policyTypesRepo.findOne.mockResolvedValue({
      id: 'type-1',
      schemaVersion: 1,
      schema: {
        sections: [
          {
            id: 'coverage',
            title: 'Coverage',
            fields: [
              {
                key: 'coverageAmount',
                label: 'Coverage amount',
                type: 'number',
                required: true,
                min: 0,
              },
            ],
          },
        ],
      },
    });

    policiesRepo.findOne.mockResolvedValue({
      id: 'policy-1',
      name: 'Office Cover',
      status: PolicyStatus.DRAFT,
      typeId: 'type-1',
      attributes: { coverageAmount: 100000 },
      type: { id: 'type-1', name: 'Property' },
    });

    const result = await service.create({
      typeId: 'type-1',
      name: 'Office Cover',
      attributes: { coverageAmount: 100000 },
    });

    expect(policiesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PolicyStatus.DRAFT,
        searchText: 'office cover 100000',
      }),
    );
    expect(result.id).toBe('policy-1');
  });

  it('throws when policy type is missing', async () => {
    policyTypesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        typeId: 'missing',
        name: 'X',
        attributes: {},
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
