import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import type { PolicyField, PolicyTypeSchema } from './policy-schema';

const IMAGE_VALUE = z
  .string()
  .min(1)
  .max(700_000)
  .refine((value) => isImageValue(value), {
    message: 'Expected an image URL or uploaded image',
  });

export function isImageValue(value: string) {
  if (/^https?:\/\/\S+$/i.test(value.trim())) return true;
  return /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(
    value,
  );
}

function fieldZod(field: PolicyField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case 'string':
      schema = z.string().max(200);
      break;
    case 'text':
      schema = z.string().max(8000);
      break;
    case 'image':
      schema = IMAGE_VALUE;
      break;
    case 'number': {
      let numberSchema = z.number().finite();
      if (field.min !== undefined) numberSchema = numberSchema.min(field.min);
      if (field.max !== undefined) numberSchema = numberSchema.max(field.max);
      schema = numberSchema;
      break;
    }
    case 'boolean':
      schema = z.boolean();
      break;
    case 'date':
      schema = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
        .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date');
      break;
    case 'select':
      schema = z.enum(field.options as [string, ...string[]]);
      break;
    case 'multiselect':
      schema = z
        .array(z.enum(field.options as [string, ...string[]]))
        .max(field.options?.length ?? 50);
      break;
    default:
      schema = z.never();
  }

  return field.required
    ? schema
    : field.type === 'image'
      ? z.preprocess(
          (value) => (value === '' ? undefined : value),
          schema.optional(),
        )
      : schema.optional();
}

export function buildAttributesSchema(typeSchema: PolicyTypeSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const section of typeSchema.sections) {
    for (const field of section.fields) {
      shape[field.key] = fieldZod(field);
    }
  }

  return z.object(shape).strict();
}

export function validateAttributes(
  typeSchema: PolicyTypeSchema,
  attributes: unknown,
): Record<string, unknown> {
  const result = buildAttributesSchema(typeSchema).safeParse(attributes ?? {});

  if (!result.success) {
    throw new BadRequestException({
      message: 'Invalid policy attributes',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'attributes',
        message: issue.message,
      })),
    });
  }

  return result.data;
}
