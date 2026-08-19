import { z } from 'zod';

export const FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'date',
  'select',
  'multiselect',
  'text',
  'image',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const policyFieldSchema = z
  .object({
    key: z
      .string()
      .min(1)
      .max(64)
      .regex(
        /^[a-z][a-zA-Z0-9_]*$/,
        'Field key must be camelCase or snake_case',
      ),
    label: z.string().min(1).max(120),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().optional().default(false),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.string().min(1).max(80)).max(50).optional(),
  })
  .superRefine((field, ctx) => {
    if (
      (field.type === 'select' || field.type === 'multiselect') &&
      (!field.options || field.options.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'select/multiselect fields require options',
        path: ['options'],
      });
    }
    if (
      (field.min !== undefined || field.max !== undefined) &&
      field.type !== 'number'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min and max are only allowed on number fields',
        path: [field.min !== undefined ? 'min' : 'max'],
      });
    }
  });

export const policySectionSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-zA-Z0-9_]*$/),
  title: z.string().min(1).max(120),
  fields: z.array(policyFieldSchema).min(1).max(40),
});

export const policyTypeSchema = z
  .object({
    sections: z.array(policySectionSchema).min(1).max(20),
  })
  .superRefine((schema, ctx) => {
    const seen = new Set<string>();
    for (const [sectionIndex, section] of schema.sections.entries()) {
      for (const [fieldIndex, field] of section.fields.entries()) {
        if (seen.has(field.key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate field key "${field.key}"`,
            path: ['sections', sectionIndex, 'fields', fieldIndex, 'key'],
          });
        }
        seen.add(field.key);
      }
    }
  });

export type PolicyField = z.infer<typeof policyFieldSchema>;
export type PolicySection = z.infer<typeof policySectionSchema>;
export type PolicyTypeSchema = z.infer<typeof policyTypeSchema>;

export function parsePolicyTypeSchema(input: unknown): PolicyTypeSchema {
  return policyTypeSchema.parse(input);
}
