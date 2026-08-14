import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../entities/user-role.enum';
import { Policy } from '../entities/policy.entity';
import { PolicyEvent } from '../entities/policy-event.entity';
import { PolicyEventType } from '../entities/policy-event-type.enum';
import { PolicyStatus } from '../entities/policy-status.enum';
import { PolicyType } from '../entities/policy-type.entity';
import { PoliciesService } from './policies.service';

const actor = {
  id: 'user-1',
  email: 'admin@local.dev',
  role: UserRole.ADMIN,
};

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

  const eventsRepo = {
    create: jest.fn((value: Partial<PolicyEvent>) => value),
    save: jest.fn((value: Partial<PolicyEvent>) => Promise.resolve(value)),
    find: jest.fn(),
  };

  let service: PoliciesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: getRepositoryToken(Policy), useValue: policiesRepo },
        { provide: getRepositoryToken(PolicyType), useValue: policyTypesRepo },
        { provide: getRepositoryToken(PolicyEvent), useValue: eventsRepo },
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

    const result = await service.create(
      {
        typeId: 'type-1',
        name: 'Office Cover',
        attributes: { coverageAmount: 100000 },
      },
      actor,
    );

    expect(policiesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PolicyStatus.DRAFT,
        searchText: 'office cover 100000',
      }),
    );
    expect(eventsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PolicyEventType.CREATED,
        actorEmail: actor.email,
      }),
    );
    expect(result.id).toBe('policy-1');
  });

  it('throws when policy type is missing', async () => {
    policyTypesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          typeId: 'missing',
          name: 'X',
          attributes: {},
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters and paginates the policy list without loading attributes', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[{ id: 'p1', name: 'UAE Weekend Cover' }], 1]),
    };
    policiesRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({
      q: 'UAE%',
      status: PolicyStatus.ACTIVE,
      typeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      attrKey: 'regions',
      attrValue: 'UAE',
      page: 2,
      limit: 10,
    });

    expect(qb.select).toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(qb.andWhere).toHaveBeenCalledWith(
      `policy.searchText ILIKE :q ESCAPE '\\'`,
      { q: '%uae\\%%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('policy.typeId = :typeId', {
      typeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('policy.status = :status', {
      status: PolicyStatus.ACTIVE,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('CAST(:attrJson AS jsonb)'),
      {
        attrKey: 'regions',
        attrJson: '"UAE"',
        attrValue: 'UAE',
      },
    );
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('filters policies whose schema version is behind the product', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    policiesRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({ staleSchema: true, page: 1, limit: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'policy.schemaVersion < type.schemaVersion',
    );
    expect(result.meta.totalPages).toBe(0);
  });

  it('throws when a policy is missing', async () => {
    policiesRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates attributes against the current product schema', async () => {
    policiesRepo.findOne.mockResolvedValue({
      id: 'policy-1',
      name: 'Office Cover',
      status: PolicyStatus.DRAFT,
      typeId: 'type-1',
      schemaVersion: 1,
      attributes: { coverageAmount: 100000 },
      type: {
        id: 'type-1',
        name: 'Property',
        schemaVersion: 3,
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
      },
    });

    const result = await service.update(
      'policy-1',
      { attributes: { coverageAmount: 250000 } },
      actor,
    );

    expect(policiesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 3,
        attributes: { coverageAmount: 250000 },
      }),
    );
    expect(eventsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: PolicyEventType.UPDATED }),
    );
    expect(result.id).toBe('policy-1');
  });

  it('records a status change', async () => {
    policiesRepo.findOne.mockResolvedValue({
      id: 'policy-1',
      status: PolicyStatus.DRAFT,
      type: { id: 'type-1' },
    });

    await service.updateStatus(
      'policy-1',
      { status: PolicyStatus.ACTIVE },
      actor,
    );

    expect(policiesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: PolicyStatus.ACTIVE }),
    );
    expect(eventsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: PolicyEventType.STATUS_CHANGED }),
    );
  });

  it('lists events after confirming the policy exists', async () => {
    policiesRepo.findOne.mockResolvedValue({ id: 'policy-1' });
    eventsRepo.find.mockResolvedValue([{ id: 'evt-1' }]);

    await expect(service.listEvents('policy-1')).resolves.toEqual([
      { id: 'evt-1' },
    ]);
    expect(eventsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it('summarizes counts without loading policy rows', async () => {
    const statusQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { status: PolicyStatus.DRAFT, count: '2' },
        { status: PolicyStatus.ACTIVE, count: '5' },
      ]),
    };
    const typeQb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ id: 'type-1', name: 'Travel', count: '4' }]),
    };
    const staleQb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
    };
    policiesRepo.createQueryBuilder
      .mockReturnValueOnce(statusQb)
      .mockReturnValueOnce(typeQb)
      .mockReturnValueOnce(staleQb);

    const result = await service.summarize();

    expect(result).toEqual({
      total: 7,
      byStatus: { DRAFT: 2, ACTIVE: 5, INACTIVE: 0 },
      byType: [{ id: 'type-1', name: 'Travel', count: 4 }],
      staleSchema: 1,
    });
  });
});
