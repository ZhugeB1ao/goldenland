import { fetchFeaturedProjects } from '../services/projects'
export async function FeaturedProjectsSection() {

  const response = await fetchFeaturedProjects()
  const projects = response.data

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold uppercase tracking-tighter text-on-surface">
          Dự án bất động sản nổi bật
        </h2>
        <a className="group flex items-center gap-1 font-semibold text-primary" href="/projects">
          Xem thêm
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {projects.map((project) => {
          const thumbnail = typeof project.thumbnail === 'object' ? project.thumbnail?.url : null
          const fallbackImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'
          const imageCount = project.images?.length || 0
          
          return (
            <div
              key={project.id}
              className="cursor-pointer overflow-hidden rounded-lg border border-outline-variant/20 bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  alt={project.name} 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" 
                  src={thumbnail || fallbackImage} 
                />
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <span className={`rounded px-2 py-0.5 text-[10px] text-white ${
                    project.saleStatus === 'active' ? 'bg-green-500' : 
                    project.saleStatus === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {project.saleStatus === 'active' ? 'Đang mở bán' : 
                     project.saleStatus === 'upcoming' ? 'Sắp mở bán' : 'Đã bàn giao'}
                  </span>
                </div>
                {imageCount > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
                    <span className="material-symbols-outlined text-xs">image</span>
                    {imageCount}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="mb-1 line-clamp-1 text-sm font-bold" title={project.name}>
                  {project.name}
                </h4>
                <p className="text-xs text-secondary">
                  {project.totalArea ? `${project.totalArea} ha` : 'Đang cập nhật diện tích'}
                </p>
                <p className="mt-2 line-clamp-1 text-xs text-zinc-500" title={project.address || ''}>
                  {project.address || 'Liên hệ để biết vị trí'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
