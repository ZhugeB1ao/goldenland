'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Project } from '@/payload-types'
import { fetchFeaturedProjects } from '../services/projects'
import { ProjectGridItem } from './ProjectGridItem'

export function FeaturedProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      try {
        const response = await fetchFeaturedProjects()
        if (isMounted) {
          setProjects(response.data)
        }
      } catch (error) {
        console.error('Fetch featured projects failed:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold uppercase tracking-tighter text-on-surface">
          Dự án bất động sản nổi bật
        </h2>
        <Link className="group flex items-center gap-1 font-semibold text-primary" href="/projects">
          Xem thêm
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-secondary">Đang tải dự án nổi bật...</div>
      ) : projects.length === 0 ? (
        <div className="py-10 text-center text-secondary">Hiện chưa có dự án nổi bật nào.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectGridItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  )
}
