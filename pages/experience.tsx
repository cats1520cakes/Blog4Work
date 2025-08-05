import Navbar from '@/components/Navbar'

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

import React from 'react';
import { experiences_content } from '@/data/experience_content';
export function Timeline() {
  return (
    <div className="timeline">
      {experiences_content.map((e, idx) => (
        <div
          key={idx}
          className={`item ${idx % 2 === 0 ? 'left' : 'right'}`}
          style={{ animationDelay: `${idx * 0.15}s` }}
        >
          <div className="content">
            <time>{e.date}</time>
            <h3>{e.title}</h3>
            <p>{e.desc}</p>
            <ul>
              {e.stats.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* ───────── styled-jsx ───────── */}
      <style jsx>{`
        .timeline {
          position: relative;
          margin: 0 auto;
          padding: 2.5rem 0;
          max-width: 900px;
        }
        /* 中线 */
        .timeline::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 4px;
          transform: translateX(-50%);
          background: var(--primary);
        }

        /* 单条记录 */
        .item {
          position: relative;
          width: 50%;
          padding: 1.5rem 2rem;
          box-sizing: border-box;
          opacity: 0;
          transform: translateY(40px);
          animation: fadeInUp 0.2s ease forwards;
        }
        .item.left {
          left: 0;
          text-align: right;
        }
        .item.right {
          left: 50%;
          text-align: left;
        }

        /* 内容卡片 */
        .content {
          background: var(--glass);
          border: 1px solid var(--border);
          padding: 1.9rem 3.9rem;
          border-radius: 15px;
        }
        .item.left .content {
          border-right: 5px solid var(--primary);
        }
        .item.right .content {
          border-left: 4px solid var(--primary);
        }

        /* 文字排版 */
        time {
          display: block;
          color: var(--secondary);
          font-weight: 600;
        }
        h3 {
          margin: 0.6rem 0 0.4rem;
          font-size: 1.4rem;
        }
        ul {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.6rem;
        }
        ul li {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 0.9rem;
        }

        /* 动画 */
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 响应式：≤768px 时单列 */
        @media (max-width: 768px) {
          .timeline::before {
            left: 8px;
          }
          .item {
            width: 100%;
            padding-left: 2.5rem;
            text-align: left;
          }
          .item.left,
          .item.right {
            left: 0;
          }
          .item.left .content,
          .item.right .content {
            border-left: 4px solid var(--primary);
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
