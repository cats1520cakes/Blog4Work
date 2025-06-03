
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import ExperienceSection from '@/components/ExperienceSection';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <Navbar />
      <main style={{paddingTop:120}} className="snap-container">
        <section className="snap-section" 
        style={{display:'flex',alignItems:'center',gap:50,minHeight:'80vh',paddingTop:'100px'}}>
          <div style={{flex:1}}>
            <motion.h1 initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.8}} style={{fontSize:'3rem',lineHeight:1.2,marginBottom:20}}>
              你好，我是 <span style={{background:'linear-gradient(to right,var(--primary),var(--secondary))',WebkitBackgroundClip:'text',color:'transparent'}}>赫浩锜</span>
            </motion.h1>
            <p style={{color:'var(--gray)',maxWidth:600,fontSize:'1.1rem'}}> 关注 AI应用 | 技术创新 | 科研进展 | Make Something New of AI</p>
          </div>
          <div style={{flex:1,display:'flex',justifyContent:'center'}}>
            <div className="avatar" style={{width:250,height:250,borderRadius:'50%',position:'relative',overflow:'hidden',boxShadow:'var(--shadow)'}}>
              {<div className="avatar" style={{
                width: 250,
                height: 250,
                borderRadius: '50%',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow)'
                }}>
                <Image
                    src="/logo.jpg"
                    alt="头像"
                    layout="fill"
                    objectFit="cover"
                    priority
                />
</div>}
            </div>
          </div>
        </section>
        <section className="snap-section" style={{padding:'5rem 0'}} id="experience"> 
          <ExperienceSection />
        </section>
      </main>
    </>
  );
}