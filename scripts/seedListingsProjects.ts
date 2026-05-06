import dotenv from 'dotenv'
import { getPayload } from 'payload'

dotenv.config()

const seedUserEmail = 'seed.listings@goldenland.local'
const seedUserPassword = 'SeedPass123!'

type SeedProject = {
  name: string
  slug: string
  address: string
  provinceCode: string
  districtCode: string
  wardCode: string
  propertyTypes: Array<'house' | 'apartment' | 'land' | 'villa' | 'shophouse' | 'condotel'>
  status: 'draft' | 'active' | 'hidden'
  isFeatured: boolean
}

type SeedListing = {
  title: string
  slug: string
  description: string
  listingType: 'sale' | 'rent'
  postType: 'normal' | 'vip'
  price: number
  priceUnit: 'total' | 'per_m2' | 'per_month' | 'negotiable'
  propertyType:
    | 'house'
    | 'apartment'
    | 'land'
    | 'villa'
    | 'townhouse'
    | 'shophouse'
    | 'penthouse'
    | 'condotel'
    | 'warehouse'
    | 'commercial'
  area: number
  bedrooms: number
  bathrooms: number
  provinceCode: string
  districtCode: string
  wardCode: string
  address: string
  status: 'draft' | 'pending' | 'active' | 'expired' | 'sold' | 'rejected'
  label: 'normal' | 'vip' | 'hot' | 'premium'
  projectSlug?: string
}

const seedProjects = [
  {
    name: 'Khu do thi Song Xanh',
    slug: 'khu-do-thi-song-xanh',
    address: 'Phuong An Phu, Thu Duc, TP Ho Chi Minh',
    provinceCode: '79',
    districtCode: '769',
    wardCode: '26734',
    propertyTypes: ['apartment', 'house'],
    status: 'active',
    isFeatured: true,
  },
  {
    name: 'Khu nha o Riverside Garden',
    slug: 'khu-nha-o-riverside-garden',
    address: 'Phuong Hoa Xuan, Quan Cam Le, Da Nang',
    provinceCode: '48',
    districtCode: '495',
    wardCode: '20224',
    propertyTypes: ['house', 'villa'],
    status: 'active',
    isFeatured: false,
  },
  {
    name: 'Sunrise Marina Residences',
    slug: 'sunrise-marina-residences',
    address: 'Phuong Vinh Hoa, Nha Trang, Khanh Hoa',
    provinceCode: '56',
    districtCode: '568',
    wardCode: '22321',
    propertyTypes: ['apartment', 'condotel'],
    status: 'active',
    isFeatured: true,
  },
  {
    name: 'Green Valley Central',
    slug: 'green-valley-central',
    address: 'Phuong Tan Phu, Quan 7, TP Ho Chi Minh',
    provinceCode: '79',
    districtCode: '778',
    wardCode: '27343',
    propertyTypes: ['apartment', 'shophouse'],
    status: 'active',
    isFeatured: false,
  },
  {
    name: 'River Pearl Homes',
    slug: 'river-pearl-homes',
    address: 'Phuong Phu Hoi, Thu Dau Mot, Binh Duong',
    provinceCode: '74',
    districtCode: '718',
    wardCode: '25831',
    propertyTypes: ['apartment', 'house'],
    status: 'active',
    isFeatured: false,
  },
] satisfies SeedProject[]

const listingLabels: SeedListing['label'][] = ['normal', 'vip', 'hot', 'premium']

const buildSeedListings = (projects: SeedProject[]): SeedListing[] => {
  const listings: SeedListing[] = []

  let apartmentCounter = 1

  for (const project of projects) {
    for (let i = 0; i < 4; i += 1) {
      listings.push({
        title: `Can ho du an ${project.name} block ${String.fromCharCode(65 + i)}`,
        slug: `can-ho-${project.slug}-${i + 1}`,
        description: `Can ho thuoc du an ${project.name}, phu hop o va dau tu cho thue.`,
        listingType: i % 2 === 0 ? 'sale' : 'rent',
        postType: i % 3 === 0 ? 'vip' : 'normal',
        price: 2200 + apartmentCounter * 180,
        priceUnit: i % 2 === 0 ? 'total' : 'per_month',
        propertyType: 'apartment',
        area: 52 + i * 8,
        bedrooms: (i % 3) + 1,
        bathrooms: (i % 2) + 1,
        provinceCode: project.provinceCode,
        districtCode: project.districtCode,
        wardCode: project.wardCode,
        address: `${project.address} - Toa ${String.fromCharCode(65 + i)}`,
        status: 'active',
        label: listingLabels[apartmentCounter % listingLabels.length],
        projectSlug: project.slug,
      })

      apartmentCounter += 1
    }
  }

  const landAndHouseLocations = [
    {
      provinceCode: '79',
      districtCode: '760',
      wardCode: '26740',
      addressPrefix: 'Quan 1, TP Ho Chi Minh',
    },
    {
      provinceCode: '48',
      districtCode: '492',
      wardCode: '20194',
      addressPrefix: 'Quan Hai Chau, Da Nang',
    },
    {
      provinceCode: '01',
      districtCode: '008',
      wardCode: '00124',
      addressPrefix: 'Quan Ba Dinh, Ha Noi',
    },
    {
      provinceCode: '74',
      districtCode: '721',
      wardCode: '25939',
      addressPrefix: 'Di An, Binh Duong',
    },
  ] as const

  for (let i = 0; i < 5; i += 1) {
    const location = landAndHouseLocations[i % landAndHouseLocations.length]

    listings.push({
      title: `Nha pho trung tam khu vuc ${i + 1}`,
      slug: `nha-pho-tu-do-${i + 1}`,
      description: 'Nha pho khong thuoc du an, phap ly ro rang, giao thong thuan tien.',
      listingType: i % 3 === 0 ? 'rent' : 'sale',
      postType: i % 4 === 0 ? 'vip' : 'normal',
      price: 4800 + i * 320,
      priceUnit: i % 3 === 0 ? 'per_month' : 'total',
      propertyType: 'house',
      area: 70 + i * 6,
      bedrooms: (i % 4) + 2,
      bathrooms: (i % 3) + 1,
      provinceCode: location.provinceCode,
      districtCode: location.districtCode,
      wardCode: location.wardCode,
      address: `${location.addressPrefix} - Tuyen duong so ${i + 1}`,
      status: 'active',
      label: listingLabels[i % listingLabels.length],
    })
  }

  for (let i = 0; i < 5; i += 1) {
    const location = landAndHouseLocations[(i + 1) % landAndHouseLocations.length]

    listings.push({
      title: `Dat nen phap ly day du khu ${i + 1}`,
      slug: `dat-nen-tu-do-${i + 1}`,
      description: 'Dat nen nha dat tu do, phu hop dau tu trung han va dai han.',
      listingType: 'sale',
      postType: i % 5 === 0 ? 'vip' : 'normal',
      price: 2800 + i * 260,
      priceUnit: 'total',
      propertyType: 'land',
      area: 85 + i * 12,
      bedrooms: 0,
      bathrooms: 0,
      provinceCode: location.provinceCode,
      districtCode: location.districtCode,
      wardCode: location.wardCode,
      address: `${location.addressPrefix} - Lo dat ${i + 11}`,
      status: 'active',
      label: listingLabels[(i + 2) % listingLabels.length],
    })
  }

  return listings
}

const seedListings = buildSeedListings(seedProjects)

type BasicDoc = {
  id: number
  slug?: string | null
  email?: string | null
}

const getOrCreateSeedUser = async (payload: any): Promise<BasicDoc> => {
  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: seedUserEmail,
      },
    },
    limit: 1,
    depth: 0,
  })

  if (existingUsers.docs.length > 0) {
    return existingUsers.docs[0] as BasicDoc
  }

  const createdUser = await payload.create({
    collection: 'users',
    data: {
      fullName: 'Seed Listings Owner',
      email: seedUserEmail,
      password: seedUserPassword,
      role: 'user',
    },
  })

  return createdUser as BasicDoc
}

const resetCollectionBySlugs = async (payload: any, collection: 'projects' | 'properties', slugs: string[]) => {
  await payload.delete({
    collection,
    where: {
      slug: {
        in: slugs,
      },
    },
  })
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  const ownerUser = await getOrCreateSeedUser(payload)

  await resetCollectionBySlugs(
    payload,
    'properties',
    seedListings.map((item) => item.slug),
  )
  await resetCollectionBySlugs(
    payload,
    'projects',
    seedProjects.map((item) => item.slug),
  )

  const projectBySlug = new Map<string, BasicDoc>()

  for (const project of seedProjects) {
    const createdProject = (await payload.create({
      collection: 'projects',
      data: project,
    })) as BasicDoc

    if (createdProject.slug) {
      projectBySlug.set(createdProject.slug, createdProject)
    }
  }

  for (const listing of seedListings) {
    const { projectSlug, ...listingData } = listing

    const data: Record<string, unknown> = {
      ...listingData,
      user: ownerUser.id,
    }

    if (projectSlug) {
      const project = projectBySlug.get(projectSlug)

      if (!project) {
        throw new Error(`Project with slug ${projectSlug} was not created`)
      }

      data.project = project.id
    }

    await payload.create({
      collection: 'properties',
      data: data as any,
    })
  }

  console.log(
    `Seeded ${seedProjects.length} projects and ${seedListings.length} listings using owner ${seedUserEmail}`,
  )
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed projects/listings:', error)
    process.exit(1)
  })
