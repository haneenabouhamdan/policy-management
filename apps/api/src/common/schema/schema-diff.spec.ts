import { summarizeSchemaChange } from './schema-diff';

describe('summarizeSchemaChange', () => {
  const base = {
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

  it('lists added, removed, and changed field labels', () => {
    const next = {
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
              options: ['UAE', 'EU', 'US'],
            },
            {
              key: 'notes',
              label: 'Notes',
              type: 'text' as const,
              required: false,
            },
          ],
        },
      ],
    };

    expect(summarizeSchemaChange(base, next)).toEqual({
      added: ['Notes'],
      removed: [],
      changed: ['Regions'],
    });
  });
});
