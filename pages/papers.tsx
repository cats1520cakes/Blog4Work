import { papers } from '@/components/papers'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { JSX } from 'react/jsx-runtime'

function linkify(text: string): JSX.Element[] {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    part.match(/^https?:\/\/[^\s]+$/) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}


export default function Papers() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 120 }} className="bg-gray-50 min-h-screen px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-neutral-900 mb-10 tracking-tight">
            <i className="fas fa-file-pdf mr-2" />
            我的论文成果
          </h1>

          <div className="space-y-6">
            {papers.map((p, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <h2 className="text-xl font-semibold text-neutral-800 tracking-tight mb-1">
                  <Link href={p.file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {p.title}
                  </Link>
                </h2>
                <p className="text-sm text-neutral-500">{p.conference} · {p.year}</p>
                <p className="text-neutral-600 mt-2 leading-relaxed">{linkify(p.description)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
