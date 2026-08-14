import type { PolicyTypeSchema } from '../common/schema/policy-schema';
import { buildSearchText } from '../common/schema/build-search-text';
import { validateAttributes } from '../common/schema/attribute-validator';
import dataSource from './data-source';
import { Policy } from '../entities/policy.entity';
import { PolicyStatus } from '../entities/policy-status.enum';
import { PolicyType } from '../entities/policy-type.entity';
import { Tenant } from '../entities/tenant.entity';

type ProductSeed = {
  name: string;
  description: string;
  schema: PolicyTypeSchema;
};

type PolicySeed = {
  name: string;
  typeName: string;
  status: PolicyStatus;
  attributes: Record<string, unknown>;
};

const PRODUCTS: ProductSeed[] = [
  {
    name: 'Travel',
    description: 'Travel insurance product',
    schema: {
      sections: [
        {
          id: 'trip',
          title: 'Trip details',
          fields: [
            {
              key: 'regions',
              label: 'Regions',
              type: 'multiselect',
              required: true,
              options: ['UAE', 'GCC', 'EU', 'US', 'Worldwide'],
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
              key: 'medicalCover',
              label: 'Medical cover amount',
              type: 'number',
              required: true,
              min: 0,
            },
            {
              key: 'maxAge',
              label: 'Maximum age',
              type: 'number',
              required: true,
              min: 1,
              max: 99,
            },
          ],
        },
      ],
    },
  },
  {
    name: 'Property',
    description: 'Property insurance product',
    schema: {
      sections: [
        {
          id: 'risk',
          title: 'Risk details',
          fields: [
            {
              key: 'propertyType',
              label: 'Property type',
              type: 'select',
              required: true,
              options: ['Apartment', 'Villa', 'Office', 'Warehouse'],
            },
            {
              key: 'territory',
              label: 'Territory',
              type: 'select',
              required: true,
              options: ['UAE', 'GCC', 'Other'],
            },
            {
              key: 'coverageAmount',
              label: 'Coverage amount',
              type: 'number',
              required: true,
              min: 0,
            },
            {
              key: 'deductible',
              label: 'Deductible',
              type: 'number',
              required: true,
              min: 0,
            },
          ],
        },
      ],
    },
  },
  {
    name: 'Membership',
    description: 'Membership plan product',
    schema: {
      sections: [
        {
          id: 'plan',
          title: 'Plan details',
          fields: [
            {
              key: 'tier',
              label: 'Tier',
              type: 'select',
              required: true,
              options: ['Basic', 'Plus', 'Premium'],
            },
            {
              key: 'billingPeriod',
              label: 'Billing period',
              type: 'select',
              required: true,
              options: ['Monthly', 'Yearly'],
            },
            {
              key: 'benefits',
              label: 'Benefits',
              type: 'multiselect',
              required: true,
              options: ['Gym', 'Dental', 'Vision', 'Travel', 'Roadside'],
            },
            {
              key: 'maxMembers',
              label: 'Max members',
              type: 'number',
              required: true,
              min: 1,
              max: 20,
            },
          ],
        },
      ],
    },
  },
];

const POLICIES: PolicySeed[] = [
  {
    name: 'UAE Weekend Cover',
    typeName: 'Travel',
    status: PolicyStatus.ACTIVE,
    attributes: {
      regions: ['UAE'],
      maxTripDays: 7,
      medicalCover: 50000,
      maxAge: 65,
    },
  },
  {
    name: 'GCC Family Travel',
    typeName: 'Travel',
    status: PolicyStatus.DRAFT,
    attributes: {
      regions: ['UAE', 'GCC'],
      maxTripDays: 21,
      medicalCover: 150000,
      maxAge: 75,
    },
  },
  {
    name: 'Europe Business Trip',
    typeName: 'Travel',
    status: PolicyStatus.ACTIVE,
    attributes: {
      regions: ['EU'],
      maxTripDays: 14,
      medicalCover: 100000,
      maxAge: 70,
    },
  },
  {
    name: 'Worldwide Annual Travel',
    typeName: 'Travel',
    status: PolicyStatus.INACTIVE,
    attributes: {
      regions: ['Worldwide'],
      maxTripDays: 365,
      medicalCover: 250000,
      maxAge: 80,
    },
  },
  {
    name: 'Marina Apartment',
    typeName: 'Property',
    status: PolicyStatus.ACTIVE,
    attributes: {
      propertyType: 'Apartment',
      territory: 'UAE',
      coverageAmount: 1800000,
      deductible: 5000,
    },
  },
  {
    name: 'DIFC Office Cover',
    typeName: 'Property',
    status: PolicyStatus.DRAFT,
    attributes: {
      propertyType: 'Office',
      territory: 'UAE',
      coverageAmount: 4200000,
      deductible: 10000,
    },
  },
  {
    name: 'Warehouse Jebel Ali',
    typeName: 'Property',
    status: PolicyStatus.INACTIVE,
    attributes: {
      propertyType: 'Warehouse',
      territory: 'UAE',
      coverageAmount: 6500000,
      deductible: 25000,
    },
  },
  {
    name: 'Gold Membership',
    typeName: 'Membership',
    status: PolicyStatus.ACTIVE,
    attributes: {
      tier: 'Premium',
      billingPeriod: 'Yearly',
      benefits: ['Gym', 'Dental', 'Vision', 'Travel'],
      maxMembers: 4,
    },
  },
  {
    name: 'Starter Membership',
    typeName: 'Membership',
    status: PolicyStatus.DRAFT,
    attributes: {
      tier: 'Basic',
      billingPeriod: 'Monthly',
      benefits: ['Gym'],
      maxMembers: 1,
    },
  },
  {
    name: 'Family Plus Plan',
    typeName: 'Membership',
    status: PolicyStatus.ACTIVE,
    attributes: {
      tier: 'Plus',
      billingPeriod: 'Yearly',
      benefits: ['Dental', 'Vision'],
      maxMembers: 5,
    },
  },
  {
    name: 'Legacy Club Plan',
    typeName: 'Membership',
    status: PolicyStatus.INACTIVE,
    attributes: {
      tier: 'Premium',
      billingPeriod: 'Yearly',
      benefits: ['Gym', 'Dental', 'Vision', 'Travel', 'Roadside'],
      maxMembers: 8,
    },
  },
];

const NORTHWIND_PRODUCTS: ProductSeed[] = [
  {
    name: 'Cargo',
    description: 'Marine cargo cover for Northwind MGA',
    schema: {
      sections: [
        {
          id: 'shipment',
          title: 'Shipment',
          fields: [
            {
              key: 'incoterm',
              label: 'Incoterm',
              type: 'select',
              required: true,
              options: ['CIF', 'FOB', 'EXW'],
            },
            {
              key: 'sumInsured',
              label: 'Sum insured',
              type: 'number',
              required: true,
              min: 1000,
            },
            {
              key: 'territory',
              label: 'Territory',
              type: 'select',
              required: true,
              options: ['UAE', 'GCC', 'Worldwide'],
            },
          ],
        },
      ],
    },
  },
];

const NORTHWIND_POLICIES: PolicySeed[] = [
  {
    name: 'Jebel Ali CIF shipment',
    typeName: 'Cargo',
    status: PolicyStatus.ACTIVE,
    attributes: {
      incoterm: 'CIF',
      sumInsured: 250000,
      territory: 'UAE',
    },
  },
  {
    name: 'FOB spare parts draft',
    typeName: 'Cargo',
    status: PolicyStatus.DRAFT,
    attributes: {
      incoterm: 'FOB',
      sumInsured: 40000,
      territory: 'GCC',
    },
  },
];

async function seedBook(
  tenant: Tenant,
  products: ProductSeed[],
  policies: PolicySeed[],
) {
  const typesRepo = dataSource.getRepository(PolicyType);
  const policiesRepo = dataSource.getRepository(Policy);
  const typesByName = new Map<string, PolicyType>();

  for (const product of products) {
    let type = await typesRepo.findOne({
      where: { name: product.name, tenantId: tenant.id },
    });
    if (!type) {
      type = await typesRepo.save(
        typesRepo.create({
          tenantId: tenant.id,
          name: product.name,
          description: product.description,
          schema: product.schema,
          schemaVersion: 1,
        }),
      );
    }
    typesByName.set(product.name, type);
  }

  let created = 0;
  for (const item of policies) {
    const existing = await policiesRepo.findOne({
      where: { name: item.name, tenantId: tenant.id },
    });
    if (existing) continue;

    const type = typesByName.get(item.typeName);
    if (!type) continue;

    try {
      const attributes = validateAttributes(type.schema, item.attributes);
      await policiesRepo.save(
        policiesRepo.create({
          tenantId: tenant.id,
          typeId: type.id,
          name: item.name,
          status: item.status,
          attributes,
          schemaVersion: type.schemaVersion,
          searchText: buildSearchText(item.name, attributes),
        }),
      );
      created += 1;
    } catch (error) {
      console.warn(
        `Skipped "${item.name}": attributes do not match existing ${item.typeName} schema`,
      );
      if (error instanceof Error) {
        console.warn(error.message);
      }
    }
  }

  return { products: typesByName.size, created };
}

async function seed() {
  await dataSource.initialize();
  await dataSource.runMigrations();
  const tenantsRepo = dataSource.getRepository(Tenant);
  const atom = await tenantsRepo.findOne({ where: { slug: 'atom' } });
  const northwind = await tenantsRepo.findOne({ where: { slug: 'northwind' } });
  if (!atom || !northwind) {
    throw new Error('Tenants missing. Run migrations first.');
  }

  const atomResult = await seedBook(atom, PRODUCTS, POLICIES);
  const northwindResult = await seedBook(
    northwind,
    NORTHWIND_PRODUCTS,
    NORTHWIND_POLICIES,
  );
  const total = await dataSource.getRepository(Policy).count();

  console.log(
    `Seed complete. Atom products: ${atomResult.products}, policies added: ${atomResult.created}. Northwind products: ${northwindResult.products}, policies added: ${northwindResult.created}. Total policies: ${total}.`,
  );
  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
