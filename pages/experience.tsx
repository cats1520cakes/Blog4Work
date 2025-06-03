import Navbar from '@/components/Navbar'
import Timeline from '@/components/Timeline'

export default function Experience() {
  return (
    <>
      <Navbar />
      <main style={{paddingTop:120}} className="snap-container">     {/* 统一改用 Tailwind */}
        <h1 className="mb-10 text-center text-3xl font-bold">
          <i className="fas fa-briefcase mr-2" />
          个人经历
        </h1>
        <Timeline />
      </main>
    </>
  )
}
