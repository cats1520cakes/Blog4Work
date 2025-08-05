import { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getSortedPostsMeta, PostMeta } from '@/components/posts_read'

type Props = { posts: PostMeta[] }

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = getSortedPostsMeta()
  return { props: { posts } }
}

const Blog: NextPage<Props> = ({ posts }) => (
  <>
    <Navbar />
    <main style={{ paddingTop: 120 }} className="snap-container bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-10 text-center text-4xl font-bold text-neutral-900 tracking-tight">
          <i className="fas fa-blog mr-2" />
          博客文章
        </h1>

        <div className="space-y-8">
          {posts.map((p) => (
            <article
              key={p.slug}
              className="bg-white rounded-xl shadow-md p-5 transition-shadow duration-300 hover:shadow-lg"
            >
              <h2 className="text-2xl font-semibold text-neutral-800 tracking-tight mb-1">
                <Link href={`/blog/${p.slug}`} className="hover:underline">
                  {p.title}
                </Link>
              </h2>
              <p className="text-sm text-neutral-500 mb-3">{p.date}</p>
              <p className="text-base text-neutral-600 leading-relaxed">{p.description}</p>
            </article>
          ))}

          {posts.length === 0 && (
            <article className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800">施工中....</h2>
            </article>
          )}
        </div>
      </div>
    </main>
  </>
)

export default Blog
