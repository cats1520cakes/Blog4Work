import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type PostMeta = { slug: string; title: string; date: string; description: string }

const postsDir = path.join(process.cwd(), 'posts')

export function getSortedPostsMeta(): PostMeta[] {
  const filenames = fs.readdirSync(postsDir)
  const posts = filenames.map((fn) => {
    const fullPath = path.join(postsDir, fn)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data } = matter(fileContents)
    return {
      slug: fn.replace(/\.md$/, ''),
      title: String(data.title),
      date: String(data.date),
      description: String(data.description || '')
    }
  })
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}
