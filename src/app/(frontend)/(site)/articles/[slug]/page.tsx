import React from 'react'
import { getPayload } from 'payload'
import configPromise from '../../../../payload.config'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ViewCounter } from './ViewCounter'
import './news-detail.css'
import { ShareButtons } from './ShareButton'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

export default async function ArticleDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'articles',
    where: {
      slug: {
        equals: params.slug,
      },
    },
    limit: 1,
  })

  if (!docs || docs.length === 0) {
    notFound()
  }

  const article = docs[0]

  const getImageUrl = (thumbnail: any) => {
    if (thumbnail && typeof thumbnail === 'object' && thumbnail.url) {
      return thumbnail.url
    }
    return ''
  }

  return (
    <article className="article-detail-page">
      <div className="article-container">
        <header className="article-header">
          <div className="breadcrumb">
            <a href="/articles">Tin tức</a> &gt; <span>{article.title}</span>
          </div>
          <h1>{article.title}</h1>
          <div className="meta-info">
            <span className="author">Đăng bởi Quản trị viên</span> •
            <span className="date">{formatDate(article.createdAt)}</span> •
            <span className="views">{article.viewCount || 0} lượt xem</span>
          </div>
        </header>

        <ViewCounter articleId={String(article.id)} />
        <ShareButtons title={article.title} />

        {article.excerpt && <div className="article-excerpt">{article.excerpt}</div>}

        <div className="article-content">
          <RichText data={article.content} />
        </div>
      </div>
    </article>
  )
}
