import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../entities/user-role.enum';
import { PolicyType } from '../entities/policy-type.entity';
import { PolicyTypeEvent } from '../entities/policy-type-event.entity';
import { PolicyTypeEventType } from '../entities/policy-type-event-type.enum';
import { PolicyTypesService } from './policy-types.service';

const actor = {
  id: 'user-1',
  email: 'admin@local.dev',
  role: UserRole.ADMIN,
};

describe('PolicyTypesService', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((value: Partial<PolicyType>) => value),
    save: jest.fn((value: Partial<PolicyType>) =>
      Promise.resolve({ ...value, id: 'type-1' }),
    ),
  };

  const eventsRepo = {
    create: jest.fn((value: Partial<PolicyTypeEvent>) => value),
    save: jest.fn((value: Partial<PolicyTypeEvent>) => Promise.resolve(value)),
    find: jest.fn(),
  };

  let service: PolicyTypesService;

  const travelSchema = {
    sections: [
      {
        id: 'trip',
        title: 'Trip',
        fields: [
          {
            key: 'regions',
            label: 'Regions',
            type: 'multiselect' as const,
            required: true,
            options: ['UAE', 'EU'],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PolicyTypesService,
        { provide: getRepositoryToken(PolicyType), useValue: repo },
        { provide: getRepositoryToken(PolicyTypeEvent), useValue: eventsRepo },
      ],
    }).compile();
    service = module.get(PolicyTypesService);
  });

  it('bumps schemaVersion when the schema changes', async () => {
    repo.findOne.mockResolvedValue({
      id: 'type-1',
      name: 'Travel',
      description: null,
      schema: travelSchema,
      schemaVersion: 1,
    });

    const next = {
      sections: [
        {
          id: 'trip',
          title: 'Trip',
          fields: [
            {
              key: 'regions',
              label: 'Regions',
              type: 'multiselect',
              required: true,
              options: ['UAE', 'EU', 'US'],
            },
          ],
        },
      ],
    };

    const result = await service.update('type-1', { schema: next }, actor);
    expect(result.schemaVersion).toBe(2);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: 2 }),
    );
    expect(eventsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PolicyTypeEventType.SCHEMA_CHANGED,
        payload: expect.objectContaining({
          fromVersion: 1,
          toVersion: 2,
          changed: ['Regions'],
        }),
      }),
    );
  });

  it('does not bump version when the schema is unchanged', async () => {
    repo.findOne.mockResolvedValue({
      id: 'type-1',
      name: 'Travel',
      description: null,
      schema: travelSchema,
      schemaVersion: 1,
    });

    const result = await service.update(
      'type-1',
      { schema: travelSchema },
      actor,
    );
    expect(result.schemaVersion).toBe(1);
    expect(eventsRepo.save).not.toHaveBeenCalled();
  });

  it('does not bump version for name-only updates', async () => {
    repo.findOne
      .mockResolvedValueOnce({
        id: 'type-1',
        name: 'Travel',
        description: null,
        schema: travelSchema,
        schemaVersion: 1,
      })
      .mockResolvedValueOnce(null);

    const result = await service.update(
      'type-1',
      { name: 'Travel Cover' },
      actor,
    );
    expect(result.schemaVersion).toBe(1);
    expect(result.name).toBe('Travel Cover');
    expect(eventsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PolicyTypeEventType.UPDATED,
        payload: expect.objectContaining({
          name: { from: 'Travel', to: 'Travel Cover' },
        }),
      }),
    );
  });

  it('rejects duplicate names', async () => {
    repo.findOne
      .mockResolvedValueOnce({
        id: 'type-1',
        name: 'Travel',
        schema: travelSchema,
        schemaVersion: 1,
      })
      .mockResolvedValueOnce({ id: 'other', name: 'Property' });

    await expect(
      service.update('type-1', { name: 'Property' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a product at schema v1', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.create(
      { name: 'Cyber', description: 'Cyber product', schema: travelSchema },
      actor,
    );

    expect(result.schemaVersion).toBe(1);
    expect(eventsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: PolicyTypeEventType.CREATED,
        payload: expect.objectContaining({ schemaVersion: 1 }),
      }),
    );
  });

  it('rejects a duplicate product name on create', async () => {
    repo.findOne.mockResolvedValue({ id: 'existing', name: 'Travel' });
    await expect(
      service.create({ name: 'Travel', schema: travelSchema }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when a product is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists product history', async () => {
    repo.findOne.mockResolvedValue({ id: 'type-1' });
    eventsRepo.find.mockResolvedValue([{ id: 'evt-1' }]);
    await expect(service.listEvents('type-1')).resolves.toEqual([
      { id: 'evt-1' },
    ]);
  });
});
