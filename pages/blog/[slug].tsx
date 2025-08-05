import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Navbar from '@/components/Navbar'
import ReactMarkdown from 'react-markdown'

type Props = { content: string; meta: { title: string; date: string } }

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = fs.readdirSync(path.join(process.cwd(), 'posts')).map((fn) => fn.replace(/\.md$/, ''))
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const fullPath = path.join(process.cwd(), 'posts', `${slug}.md`)
  const file = fs.readFileSync(fullPath, 'utf8')
  const { content, data } = matter(file)
  return { props: { content, meta: { title: data.title, date: data.date } } }
}

const PostPage: NextPage<Props> = ({ content, meta }) => (
  <>
    <Navbar />
    <main style={{ paddingTop: 120 }} className="px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">{meta.title}</h1>
      <p className="text-gray-500 mb-6">{meta.date}</p>
      <article className="prose prose-lg">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </main>
  </>
)

export default PostPage
