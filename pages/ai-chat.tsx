import Navbar from '@/components/Navbar';

export default function AiChat() {
  const src = process.env.NEXT_PUBLIC_SOURCE_AI_CHAT ?? '';
  return (
    <>
      <Navbar />
      <main style={{paddingTop:120,minHeight:'100vh'}}>
        <div className="container">
          <h1 style={{textAlign:'center',fontSize:'2.5rem',marginBottom:40}}><i className="fas fa-robot"/> AI 对话</h1>
          <p style={{textAlign:'center',color:'var(--gray)',marginBottom:20}}>这是我的 AI 分身，他会基于我的简历信息回答。像面试一样提问吧！</p>
          <div style={{border:'1px solid var(--border)',borderRadius:20,overflow:'hidden',boxShadow:'var(--shadow)'}}>
            <iframe src={src} className="chat-iframe" allow="microphone" />
          </div>
        </div>
      </main>
    </>
  );
}