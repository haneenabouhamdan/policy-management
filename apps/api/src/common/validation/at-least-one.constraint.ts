import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneOf', async: false })
export class AtLeastOneOfConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const object = args.object as Record<string, unknown>;
    return args.constraints.some((key: string) => object[key] !== undefined);
  }

  defaultMessage(args: ValidationArguments) {
    return `Provide at least one of: ${args.constraints.join(', ')}`;
  }
}
