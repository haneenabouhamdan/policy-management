import { parsePolicyTypeSchema, policyTypeSchema } from './policy-schema';

const valid = {
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
          options: ['UAE', 'EU'],
        },
        {
          key: 'maxTripDays',
          label: 'Max trip days',
          type: 'number',
          required: true,
          min: 1,
          max: 365,
        },
      ],
    },
  ],
};

describe('parsePolicyTypeSchema', () => {
  it('accepts a valid product schema', () => {
    expect(parsePolicyTypeSchema(valid).sections).toHaveLength(1);
  });

  it('rejects duplicate field keys across sections', () => {
    const result = policyTypeSchema.safeParse({
      sections: [
        {
          id: 'a',
          title: 'A',
          fields: [{ key: 'cover', label: 'Cover', type: 'number', min: 0 }],
        },
        {
          id: 'b',
          title: 'B',
          fields: [{ key: 'cover', label: 'Cover again', type: 'string' }],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          String(issue.message).includes('Duplicate field key'),
        ),
      ).toBe(true);
    }
  });

  it('rejects min/max on non-number fields', () => {
    const result = policyTypeSchema.safeParse({
      sections: [
        {
          id: 'a',
          title: 'A',
          fields: [{ key: 'name', label: 'Name', type: 'string', min: 1 }],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          String(issue.message).includes(
            'min and max are only allowed on number fields',
          ),
        ),
      ).toBe(true);
    }
  });
});
