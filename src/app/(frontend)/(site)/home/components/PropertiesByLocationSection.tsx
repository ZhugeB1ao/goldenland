'use client'

import { useEffect, useState } from 'react'
import { fetchPropertiesCountByLocation } from '@/app/services/properties'
import { fetchNewestProjects } from '@/app/services/projects'

type LocationCard = {
  city: string
  provinceCode: string
  image: string
}

const locations: LocationCard[] = [
  {
    city: 'TP. Hồ Chí Minh',
    provinceCode: '79',
    image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Provinces/tp-ho-chi-minh.jpg`,
  },
  {
    city: 'Hà Nội',
    provinceCode: '01',
    image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Provinces/ha-noi.jpg`,
  },
  {
    city: 'Đà Nẵng',
    provinceCode: '48',
    image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Provinces/da-nang.webp`,
  },
  {
    city: 'Bình Dương',
    provinceCode: '74',
    image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Provinces/binh-duong.webp`,
  },
  {
    city: 'Đồng Nai',
    provinceCode: '75',
    image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Provinces/dong-nai.jpg`,
  },
]

export function PropertiesByLocationSection() {
  const [countsByProvince, setCountsByProvince] = useState<Record<string, number>>({})
  const [dynamicTags, setDynamicTags] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [countsResults, projectsResponse] = await Promise.all([
          Promise.all(
            locations.map(async (location) => {
              const count = await fetchPropertiesCountByLocation(location.provinceCode)
              return [location.provinceCode, count] as const
            }),
          ),
          fetchNewestProjects(),
        ])

        if (!isMounted) return

        setCountsByProvince(Object.fromEntries(countsResults))
        setDynamicTags(projectsResponse.data.map((project) => project.name))
      } catch {
        if (!isMounted) return
        setCountsByProvince({})
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const formatCount = (provinceCode: string) => {
    const count = countsByProvince[provinceCode]

    if (typeof count !== 'number') {
      return 'Đang cập nhật'
    }

    return `${count} tin đăng`
  }

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-24">
      <h2 className="mb-8 text-3xl font-bold uppercase tracking-tighter text-on-surface">
        Bất động sản theo địa điểm
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        <div className="city-card lg:col-span-6 h-full">
          <img alt={locations[0].city} src={locations[0].image} />
          <div className="city-card-overlay">
            <h3 className="text-2xl font-bold text-white">{locations[0].city}</h3>
            <p className="text-sm text-white/80">{formatCount(locations[0].provinceCode)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:col-span-6">
          {locations.slice(1).map((city) => (
            <div key={city.city} className="city-card">
              <img alt={city.city} src={city.image} />
              <div className="city-card-overlay p-4">
                <h3 className="text-lg font-bold text-white">{city.city}</h3>
                <p className="text-[10px] text-white/80">{formatCount(city.provinceCode)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {dynamicTags.map((item) => (
          <span
            key={item}
            className="cursor-pointer rounded-full bg-zinc-100 px-4 py-2 text-xs text-secondary transition-colors hover:bg-primary hover:text-white"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
