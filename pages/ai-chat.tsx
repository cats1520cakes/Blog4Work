import Navbar from '@/components/Navbar';

// 你好，我是 AI 助手，有什么可以帮你？试试看输入"我要面试赫浩锜"？
export default function AiChat() {
  // 从环境变量读取 Dify Chatbot 的 iframe 地址
  const src = process.env.NEXT_PUBLIC_SOURCE_AI_CHAT ?? '';

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 120, minHeight: '100vh' }}>
        <div className="container">
          <h1
            style={{
              textAlign: 'center',
              fontSize: '2.5rem',
              marginBottom: 40,
            }}
          >
            <i className="fas fa-robot" /> AI 对话
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--gray)',
              marginBottom: 20,
            }}
          >
            这是我的 AI 分身，他会基于我的简历信息回答问题。试试看输入"我要面试赫浩锜"？（为了深度体验，进入面试后将不会退出）
          </p>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}
          >
            <iframe
              src={src}
              // 支持麦克风输入
              allow="microphone"
              // 去除边框
              frameBorder="0"
              // 全面铺满容器，并设置最低高度
              style={{
                width: '100%',
                height: '100%',
                minHeight: '700px',
              }}
              // 推荐添加无障碍属性
              title="AI Chatbot"
            />
          </div>
        </div>
      </main>
    </>
  );
}
