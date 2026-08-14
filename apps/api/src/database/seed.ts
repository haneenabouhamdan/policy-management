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

function photo(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
}

const TRAVEL_SCHEMA: PolicyTypeSchema = {
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
    {
      id: 'period',
      title: 'Insured and period',
      fields: [
        {
          key: 'leadInsured',
          label: 'Lead insured',
          type: 'string',
          required: false,
        },
        {
          key: 'periodFrom',
          label: 'Period from',
          type: 'date',
          required: false,
        },
        {
          key: 'periodTo',
          label: 'Period to',
          type: 'date',
          required: false,
        },
      ],
    },
    {
      id: 'wording',
      title: 'Schedule wording',
      fields: [
        {
          key: 'scheduleWording',
          label: 'Schedule of cover',
          type: 'text',
          required: false,
        },
        {
          key: 'specialConditions',
          label: 'Special conditions',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      id: 'documents',
      title: 'Documents',
      fields: [
        {
          key: 'destinationPhoto',
          label: 'Destination / itinerary photo',
          type: 'image',
          required: false,
        },
      ],
    },
  ],
};

const PROPERTY_SCHEMA: PolicyTypeSchema = {
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
    {
      id: 'situation',
      title: 'Situation of risk',
      fields: [
        {
          key: 'insuredName',
          label: 'Insured',
          type: 'string',
          required: false,
        },
        {
          key: 'riskAddress',
          label: 'Situation of risk',
          type: 'text',
          required: false,
        },
        {
          key: 'propertyPhoto',
          label: 'Property photo',
          type: 'image',
          required: false,
        },
      ],
    },
    {
      id: 'wording',
      title: 'Interest and conditions',
      fields: [
        {
          key: 'interestInsured',
          label: 'Interest insured',
          type: 'text',
          required: false,
        },
        {
          key: 'specialConditions',
          label: 'Special conditions',
          type: 'text',
          required: false,
        },
      ],
    },
  ],
};

const MEMBERSHIP_SCHEMA: PolicyTypeSchema = {
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
    {
      id: 'membership',
      title: 'Member schedule',
      fields: [
        {
          key: 'primaryMember',
          label: 'Primary member',
          type: 'string',
          required: false,
        },
        {
          key: 'planWording',
          label: 'Plan wording',
          type: 'text',
          required: false,
        },
        {
          key: 'memberPhoto',
          label: 'Member / club photo',
          type: 'image',
          required: false,
        },
      ],
    },
  ],
};

const CARGO_SCHEMA: PolicyTypeSchema = {
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
    {
      id: 'cargo',
      title: 'Cargo schedule',
      fields: [
        {
          key: 'assured',
          label: 'Assured',
          type: 'string',
          required: false,
        },
        {
          key: 'goodsDescription',
          label: 'Goods description',
          type: 'text',
          required: false,
        },
        {
          key: 'instituteClauses',
          label: 'Clauses and conditions',
          type: 'text',
          required: false,
        },
        {
          key: 'cargoPhoto',
          label: 'Cargo photo',
          type: 'image',
          required: false,
        },
      ],
    },
  ],
};

const PRODUCTS: ProductSeed[] = [
  {
    name: 'Travel',
    description: 'Travel insurance product',
    schema: TRAVEL_SCHEMA,
  },
  {
    name: 'Property',
    description: 'Property insurance product',
    schema: PROPERTY_SCHEMA,
  },
  {
    name: 'Membership',
    description: 'Membership plan product',
    schema: MEMBERSHIP_SCHEMA,
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
      leadInsured: 'Layla Al Mansoori',
      periodFrom: '2026-09-04',
      periodTo: '2026-09-07',
      scheduleWording:
        'This policy provides emergency medical expenses, repatriation, and 24-hour assistance for leisure trips wholly within the United Arab Emirates. Maximum duration any one trip: 7 consecutive days. Medical expenses sum insured: AED 50,000. Cover applies to insured persons aged 65 or under at departure.',
      specialConditions:
        '1. Pre-existing medical conditions are excluded unless declared and accepted in writing.\n2. Winter sports, motorsports, and travel against local authority advice are excluded.\n3. Claims must be notified to the assistance provider within 48 hours of the incident.\n4. This working copy is not a certificate of insurance.',
      destinationPhoto: photo('photo-1512453979798-5ea266f8880c'),
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
      leadInsured: 'Omar and Noor Al Farsi family',
      periodFrom: '2026-10-12',
      periodTo: '2026-10-28',
      scheduleWording:
        'Family travel cover for the United Arab Emirates and wider GCC. Medical expenses AED 150,000 per person. Maximum trip length 21 days. Includes emergency dental relief and hospital daily benefit as set out in the product wording.',
      specialConditions:
        '1. Children under 18 must travel with a named adult insured.\n2. Cover pauses if any insured person exceeds 75 years of age during the trip.\n3. Cancellation cover is not included on this draft until premium is agreed.',
      destinationPhoto: photo('photo-1539650116574-75c0c6d73f6e'),
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
      leadInsured: 'Maya Hassan',
      periodFrom: '2026-08-18',
      periodTo: '2026-08-27',
      scheduleWording:
        'Single-trip business travel for the European Union. Medical expenses AED 100,000. Personal accident and delayed baggage as per the Atom business travel wording. Trip must not exceed 14 days.',
      specialConditions:
        '1. Business meetings and conferences are covered; manual work is excluded.\n2. Hired car collision damage waiver is not included.\n3. Proof of Schengen visa, if required, must be held before departure.',
      destinationPhoto: photo('photo-1467269204594-9661b134dd2b'),
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
      leadInsured: 'Rashid Al Nuaimi',
      periodFrom: '2026-01-01',
      periodTo: '2026-12-31',
      scheduleWording:
        'Annual multi-trip worldwide cover. Medical expenses AED 250,000. Any one trip may last up to 365 days. USA and Canada included. Cover was placed in force and later made inactive pending premium adjustment.',
      specialConditions:
        '1. Trips to countries under UN or UAE travel restriction are excluded.\n2. Hazardous sports require a written endorsement.\n3. Reactivation needs underwriter review of claims experience.',
      destinationPhoto: photo('photo-1436491865332-7a61a109cc05'),
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
      insuredName: 'Hessa Al Mazrouei',
      riskAddress:
        'Apartment 4201, Marina Gate 2, Dubai Marina, Dubai, UAE.\nOccupied as a private residence. Concrete frame, double glazing, sprinklered common parts. Built 2016. Floor 42 of 55.',
      propertyPhoto: photo('photo-1545324418-cc1a3fa10c00'),
      interestInsured:
        'Buildings (walls-in), landlord fixtures, and contents of the named apartment, including household goods and personal effects, while at the situation of risk.',
      specialConditions:
        '1. Survey to be completed within 30 days of inception.\n2. Jewellery and fine art limited to AED 50,000 unless scheduled.\n3. Water-damage excess AED 5,000. Terrorism excluded unless bought back.',
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
      insuredName: 'Atom Advisory DMCC',
      riskAddress:
        'Level 14, Index Tower, Dubai International Financial Centre, Dubai, UAE.\nFit-out of a professional services office. 24-hour building security and access control.',
      propertyPhoto: photo('photo-1486406146926-c627a92ad1ab'),
      interestInsured:
        'Tenant improvements, office contents, electronic equipment, and business interruption following an insured property damage event, for a 12-month indemnity period.',
      specialConditions:
        '1. Draft only — sums insured subject to a valuation of fit-out.\n2. Unattended laptops limited to AED 15,000 unless in a locked cabinet.\n3. Cyber and professional indemnity are not covered under this form.',
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
      insuredName: 'Gulf Bonded Stores LLC',
      riskAddress:
        'Plot W-18, Jebel Ali Free Zone, Dubai, UAE.\nSteel-portal warehouse with racking, forklift charging bay, and 24-hour CCTV. Used for dry goods storage only.',
      propertyPhoto: photo('photo-1586528116311-ad8dd3c8310d'),
      interestInsured:
        'Buildings, plant, racking, and stock of non-hazardous dry goods while at the named warehouse, plus debris removal.',
      specialConditions:
        '1. Cover inactive after a sprinkler-impairment notice.\n2. No tobacco, spirits, or lithium batteries without endorsement.\n3. Reactivation requires a completed impairment restoration report.',
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
      primaryMember: 'Karim Nassar',
      planWording:
        'Premium household membership for up to four named members. Includes gym access at participating clubs, dental and vision allowances as scheduled, and travel medical cover on trips of 30 days or less. Subscription is annual in advance.',
      memberPhoto: photo('photo-1534438327276-14e5300c3a48'),
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
      primaryMember: 'Sara Ibrahim',
      planWording:
        'Basic individual gym membership billed monthly. Access is limited to off-peak hours at participating venues. Dental, vision, and travel benefits are not included on this draft.',
      memberPhoto: photo('photo-1571019614242-c5c5dee9f50b'),
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
      primaryMember: 'Priya Shah',
      planWording:
        'Family Plus plan for up to five members living at the same address. Dental and vision benefits apply after a 30-day waiting period. Gym and roadside assistance are not part of this schedule.',
      memberPhoto: photo('photo-1576091160399-112ba8d25d1d'),
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
      primaryMember: 'The Haddad household',
      planWording:
        'Legacy club plan, now inactive, covering up to eight members with gym, dental, vision, travel, and roadside benefits. Held pending a mid-term adjustment of the household list.',
      memberPhoto: photo('photo-1517836357463-d25dfeac3438'),
    },
  },
];

const NORTHWIND_PRODUCTS: ProductSeed[] = [
  {
    name: 'Cargo',
    description: 'Marine cargo cover for Northwind MGA',
    schema: CARGO_SCHEMA,
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
      assured: 'Northwind Trading FZE',
      goodsDescription:
        'One 40ft container of packaged consumer electronics, new, in original cartons, stuffed at Jebel Ali and destined for Rotterdam under CIF terms. Packing: export cartons on pallets, moisture barrier.',
      instituteClauses:
        'Institute Cargo Clauses (A) 1/1/09.\nInstitute War Clauses (Cargo).\nInstitute Strikes Clauses (Cargo).\nDeductible AED 2,500 each and every loss except total loss of the conveyance.\nOn-deck stowage not covered unless declared.',
      cargoPhoto: photo('photo-1578575437130-527eed3abbec'),
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
      assured: 'Desert Plant Services LLC',
      goodsDescription:
        'Used industrial spare parts in wooden crates, FOB Jebel Ali. Condition unknown beyond shipper packing list. Draft pending survey of packing.',
      instituteClauses:
        'Institute Cargo Clauses (B) proposed.\nFOB attachment from passing ship\'s rail.\nUsed machinery: cover excludes rust, oxidation, and mechanical derangement unless caused by an insured peril.',
      cargoPhoto: photo('photo-1586528116311-ad8dd3c8310d'),
    },
  },
];

function sameJson(left: unknown, right: unknown) {
  return stableJson(left) === stableJson(right);
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, nested) => {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return Object.fromEntries(
        Object.keys(nested as Record<string, unknown>)
          .sort()
          .map((key) => [key, (nested as Record<string, unknown>)[key]]),
      );
    }
    return nested as unknown;
  });
}

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
    } else if (!sameJson(type.schema, product.schema)) {
      type.schema = product.schema;
      type.description = product.description;
      type.schemaVersion += 1;
      type = await typesRepo.save(type);
    }
    typesByName.set(product.name, type);
  }

  let created = 0;
  let updated = 0;
  for (const item of policies) {
    const type = typesByName.get(item.typeName);
    if (!type) continue;

    const existing = await policiesRepo.findOne({
      where: { name: item.name, tenantId: tenant.id },
    });

    try {
      const attributes = validateAttributes(type.schema, {
        ...item.attributes,
        ...(existing?.attributes ?? {}),
      });
      const searchText = buildSearchText(item.name, attributes);

      if (!existing) {
        await policiesRepo.save(
          policiesRepo.create({
            tenantId: tenant.id,
            typeId: type.id,
            name: item.name,
            status: item.status,
            attributes,
            schemaVersion: type.schemaVersion,
            searchText,
          }),
        );
        created += 1;
        continue;
      }

      if (
        sameJson(existing.attributes, attributes) &&
        existing.schemaVersion === type.schemaVersion
      ) {
        continue;
      }

      existing.attributes = attributes;
      existing.schemaVersion = type.schemaVersion;
      existing.searchText = searchText;
      await policiesRepo.save(existing);
      updated += 1;
    } catch (error) {
      console.warn(
        `Skipped "${item.name}": attributes do not match existing ${item.typeName} schema`,
      );
      if (error instanceof Error) {
        console.warn(error.message);
      }
    }
  }

  return { products: typesByName.size, created, updated };
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
    `Seed complete. Atom products: ${atomResult.products}, policies added: ${atomResult.created}, updated: ${atomResult.updated}. Northwind products: ${northwindResult.products}, policies added: ${northwindResult.created}, updated: ${northwindResult.updated}. Total policies: ${total}.`,
  );
  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
