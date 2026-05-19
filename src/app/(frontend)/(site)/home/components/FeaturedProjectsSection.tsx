import Link from 'next/link'
import { fetchFeaturedProjects } from '../services/projects'
import { ProjectGridItem } from './ProjectGridItem'

export async function FeaturedProjectsSection() {
  const response = await fetchFeaturedProjects()
  const projects = response.data

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {projects.map((project) => (
          <ProjectGridItem key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}
