import { BadRequestException } from '@nestjs/common';
import type { PolicyTypeSchema } from './policy-schema';
import { validateAttributes } from './attribute-validator';

const travelSchema: PolicyTypeSchema = {
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
        {
          key: 'maxTripDays',
          label: 'Max trip days',
          type: 'number',
          required: true,
          min: 1,
          max: 365,
        },
        {
          key: 'notes',
          label: 'Notes',
          type: 'text',
          required: false,
        },
      ],
    },
  ],
};

describe('validateAttributes', () => {
  it('accepts valid attributes', () => {
    const result = validateAttributes(travelSchema, {
      regions: ['UAE', 'EU'],
      maxTripDays: 14,
      notes: 'business trip',
    });

    expect(result).toEqual({
      regions: ['UAE', 'EU'],
      maxTripDays: 14,
      notes: 'business trip',
    });
  });

  it('accepts an image URL and rejects a non-image string', () => {
    const schema: PolicyTypeSchema = {
      sections: [
        {
          id: 'docs',
          title: 'Documents',
          fields: [
            {
              key: 'photo',
              label: 'Photo',
              type: 'image',
              required: true,
            },
          ],
        },
      ],
    };

    expect(
      validateAttributes(schema, {
        photo: 'https://images.example.com/risk.jpg',
      }),
    ).toEqual({ photo: 'https://images.example.com/risk.jpg' });

    expect(() =>
      validateAttributes(schema, { photo: 'not-an-image' }),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown keys', () => {
    expect(() =>
      validateAttributes(travelSchema, {
        regions: ['UAE'],
        maxTripDays: 10,
        hackerField: 'x',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects out-of-range numbers', () => {
    expect(() =>
      validateAttributes(travelSchema, {
        regions: ['UAE'],
        maxTripDays: 9999,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects missing required fields', () => {
    expect(() => validateAttributes(travelSchema, { notes: 'only' })).toThrow(
      BadRequestException,
    );
  });
});
