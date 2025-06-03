import Navbar from '@/components/Navbar'

 export default function Blog() {
   return (
     <>
       <Navbar />
       <main style={{paddingTop:120}} className="snap-container">
    
         <h1 className="mb-10 text-center text-3xl font-bold text-gray-900">
           <i className="fas fa-blog mr-2" />
           博客文章
         </h1>
         <div className="space-y-8">
           {/* 博客文章列表占位 */}
           <article className="bg-white rounded-lg shadow-lg p-6">
             <h2 className="text-xl font-semibold text-gray-800">施工中....</h2>
           </article>
           
         </div>
       </main>
     </>
   )
 }