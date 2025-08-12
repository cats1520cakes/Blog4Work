import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { pathname } = useRouter();
  const link = (href: string, label: string) => (
    <Link href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}>
      {label}
    </Link>
  );
  return (
    <header style={{position:'fixed',top:0,width:'100%',backdropFilter:'blur(10px)',background:'var(--glass)',borderBottom:'1px solid var(--border)',zIndex:1000}}>
      <div className="container" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0'}}>
        <div className="logo" style={{fontSize:'1.8rem',fontWeight:700}}>
          <i className="fas fa-code" style={{marginRight:10}} /> About Me
        </div>
        <nav className="nav-links" style={{display:'flex',gap:30}}>
          {link('/', '首页')}
          {link('/experience', '个人经历')}
          {link('/blog', '博客')}
          {link('/ai-chat', 'AI 对话')}
          {link('/papers','论文项目')}
          {link('/play/bacon','扔培根小游戏')}
          {link('/play/flashcards','闪记卡')}

        </nav>
      </div>
    </header>
  );
}