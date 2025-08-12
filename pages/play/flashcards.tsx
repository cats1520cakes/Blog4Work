import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import cardsData from "../../data/flashcards.json";
import { motion, AnimatePresence } from "framer-motion";


type Card = { id: number; question: string; answer: string; tags: string[] };
type SRSItem = { ef: number; reps: number; interval: number; due: number; last: number };
type LogItem = { ts: number; cardId: number; rating: "again"|"hard"|"good"|"easy"; revealMs: number; tags: string[]; mode: "practice"|"review" };

// ------- Utils -------
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const now = () => Date.now();
const day = 24 * 60 * 60 * 1000;
const downloadJSON = (obj: any, filename: string) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ------- Local storage keys -------
const LS_CUSTOM = "flashcards_custom";
const LS_SRS = "flashcards_srs";
const LS_LOGS = "flashcards_logs";

export default function Flashcards() {
  // Base + user cards
  const [userCards, setUserCards] = useState<Card[]>([]);
  const baseCards = (cardsData as Card[]);
  const allCards = useMemo<Card[]>(() => [...baseCards, ...userCards.map((c, i) => ({ ...c, id: 100000 + i }))], [userCards, baseCards]);

  // Tags filter
  const allTags = useMemo(() => uniq(allCards.flatMap(c => c.tags)), [allCards]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mode & state
  const [randomMode, setRandomMode] = useState(true);
  const [reviewMode, setReviewMode] = useState(true); // new SRS review mode
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const revealStartRef = useRef<number>(now());

  // SRS & logs
  const [srs, setSrs] = useState<Record<number, SRSItem>>({}); // by cardId
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_CUSTOM); if (raw) setUserCards(JSON.parse(raw));
      const rawS = localStorage.getItem(LS_SRS); if (rawS) setSrs(JSON.parse(rawS));
      const rawL = localStorage.getItem(LS_LOGS); if (rawL) setLogs(JSON.parse(rawL));
      if (raw) document.cookie = "fc_custom=1; path=/; max-age=31536000";
    } catch {}
  }, []);

  // Persist
  useEffect(() => { localStorage.setItem(LS_CUSTOM, JSON.stringify(userCards)); }, [userCards]);
  useEffect(() => { localStorage.setItem(LS_SRS, JSON.stringify(srs)); }, [srs]);
  useEffect(() => { localStorage.setItem(LS_LOGS, JSON.stringify(logs.slice(-1000))); }, [logs]);

  // Filtered set
  const filtered = useMemo(() => {
    if (selectedTags.length === 0) return allCards;
    return allCards.filter(c => selectedTags.every(t => c.tags.includes(t)));
  }, [allCards, selectedTags]);

  // Build review queue (due first)
  const reviewQueue = useMemo(() => {
    const due = filtered.filter(c => (srs[c.id]?.due ?? 0) <= now());
    const future = filtered.filter(c => (srs[c.id]?.due ?? 0) > now());
    // sort by due time asc
    due.sort((a,b) => (srs[a.id]?.due ?? 0) - (srs[b.id]?.due ?? 0));
    future.sort((a,b) => (srs[a.id]?.due ?? 0) - (srs[b.id]?.due ?? 0));
    return [...due, ...future];
  }, [filtered, srs]);

  // Current card
  const current = reviewMode ? reviewQueue[0] : filtered[index];

  // Reset reveal timer whenever current changes
  useEffect(() => {
    setRevealed(false);
    revealStartRef.current = now();
  }, [current?.id]);

  useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === " ") { e.preventDefault(); setRevealed(r => !r); }
    if (!current) return;
    // 练习模式的切题
    if (!reviewMode && (e.key === "n" || e.key === "N")) {
      (randomMode ? nextRandom() : nextSeq()); return;
    }
    if (!revealed) return; // 未揭示前不允许评分
    if (e.key === "1") rate("again");
    if (e.key === "2") rate("hard");
    if (e.key === "3" || e.key === "Enter") rate("good");
    if (e.key === "4") rate("easy");
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [current?.id, revealed, reviewMode, randomMode]);

  // Actions: next
  const nextSeq = () => {
    if (filtered.length === 0) return;
    setIndex(i => (i + 1) % filtered.length);
  };
  const nextRandom = () => {
    if (filtered.length === 0) return;
    let next = Math.floor(Math.random() * filtered.length);
    if (next === index && filtered.length > 1) next = (next + 1) % filtered.length;
    setIndex(next);
  };

  // Add custom cards
  const addCustom = (q: string, a: string, tags: string[]) => {
    if (!q.trim() || !a.trim()) return;
    const newCard: Card = { id: Date.now(), question: q.trim(), answer: a.trim(), tags: tags.filter(Boolean) };
    const next = [...userCards, newCard];
    setUserCards(next);
    document.cookie = "fc_custom=1; path=/; max-age=31536000";
  };
  const clearCustom = () => {
    setUserCards([]);
    localStorage.removeItem(LS_CUSTOM);
    document.cookie = "fc_custom=; path=/; max-age=0";
  };

  // Import / Export
  const importJSON = async (file: File) => {
    const text = await file.text();
    const arr = JSON.parse(text) as Card[];
    // simple dedupe by question text
    const existingQ = new Set(allCards.map(c => c.question));
    const merged = [...userCards];
    for (const c of arr) {
      if (!existingQ.has(c.question)) merged.push({ id: Date.now() + Math.random(), question: c.question, answer: c.answer, tags: c.tags || [] });
    }
    setUserCards(merged);
  };
  const exportJSON = () => downloadJSON(userCards, "flashcards_custom.json");

  // SRS rating update (Again/Hard/Good/Easy)
  const rate = (kind: "again"|"hard"|"good"|"easy") => {
    if (!current) return;
    const id = current.id;
    const cur = srs[id] ?? { ef: 2.5, reps: 0, interval: 0, due: 0, last: 0 };
    let { ef, reps, interval } = cur;

    // simplified SM-2-like policy (days)
    const easeDelta = (k: typeof kind) => (k === "again" ? -0.3 : k === "hard" ? -0.05 : k === "good" ? +0.05 : +0.15);
    ef = clamp((ef + easeDelta(kind)), 1.3, 2.8);

    if (kind === "again") {
      reps = 0; interval = 0.01; // ~15min for dev, change to 0 (same-day) by 0.01 day
    } else {
      reps += 1;
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = 3;
      else interval = Math.round(interval * (kind === "easy" ? Math.max(ef, 2.2) : ef));
    }

    const due = now() + interval * day;
    const nextSrs = { ...srs, [id]: { ef, reps, interval, due, last: now() } };
    setSrs(nextSrs);

    // log
    const revealMs = Math.max(0, now() - revealStartRef.current);
    const entry: LogItem = { ts: now(), cardId: id, rating: kind, revealMs, tags: current.tags, mode: reviewMode ? "review" : "practice" };
    setLogs(l => [...l, entry]);

    // advance
    if (reviewMode) {
      // refresh queue by touching state
      setIndex(i => i); // no-op to trigger re-render if needed
    } else {
      randomMode ? nextRandom() : nextSeq();
    }
    setRevealed(false);
    revealStartRef.current = now();
  };

  // Stats
  const N = 50;
  const recent = logs.slice(-N);
  const acc = (() => {
    if (recent.length === 0) return 0;
    const ok = recent.filter(x => x.rating === "good" || x.rating === "easy").length;
    return Math.round((ok / recent.length) * 100);
  })();
  const revealMsArr = recent.map(x => x.revealMs);
  const buckets = [2000, 5000, 10000, 20000]; // <2s,<5s,<10s,<20s,>=20s
  const hist = new Array(buckets.length + 1).fill(0);
  for (const v of revealMsArr) {
    let idx = buckets.findIndex(b => v < b);
    if (idx < 0) idx = buckets.length;
    hist[idx] += 1;
  }

  // Drawing charts on <canvas> (no deps)
  const accCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    // Accuracy over time (rolling)
    const cvs = accCanvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const w = (cvs.width = cvs.clientWidth * (window.devicePixelRatio || 1));
    const h = (cvs.height = 160 * (window.devicePixelRatio || 1));
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    // axes
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(32, 8); ctx.lineTo(32, 140); ctx.lineTo(cvs.clientWidth - 8, 140); ctx.stroke();

    // data
    const pts = recent.map((_, i) => {
      const sub = recent.slice(0, i+1);
      const ok = sub.filter(x => x.rating === "good" || x.rating === "easy").length;
      const p = sub.length ? ok / sub.length : 0;
      return p;
    });
    if (pts.length > 0) {
      ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = 32 + (i / Math.max(1, pts.length - 1)) * (cvs.clientWidth - 40);
        const y = 140 - p * 120;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    // labels
    ctx.fillStyle = "#64748b"; ctx.font = "12px ui-sans-serif,system-ui";
    ctx.fillText("0%", 4, 140); ctx.fillText("100%", 0, 20);
  }, [logs]);

  useEffect(() => {
    const cvs = histCanvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const w = (cvs.width = cvs.clientWidth * (window.devicePixelRatio || 1));
    const h = (cvs.height = 160 * (window.devicePixelRatio || 1));
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    // bars
    const labels = ["<2s","<5s","<10s","<20s",">=20s"];
    const maxv = Math.max(1, ...hist);
    const bw = (cvs.clientWidth - 40) / hist.length;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(32, 16, cvs.clientWidth - 40, 124);
    for (let i = 0; i < hist.length; i++) {
      const v = hist[i];
      const x = 32 + i * bw + 6;
      const barW = bw - 12;
      const hpx = (v / maxv) * 120;
      ctx.fillStyle = "#10b981";
      ctx.fillRect(x, 140 - hpx, barW, hpx);
      ctx.fillStyle = "#475569"; ctx.font = "12px ui-sans-serif,system-ui";
      ctx.fillText(String(v), x + barW/2 - 6, 140 - hpx - 6);
      ctx.fillText(labels[i], x + barW/2 - 14, 156);
    }
  }, [logs]);

  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-[1100px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   className="inline-block align-middle shrink-0"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="inline-block align-middle">返回主页</span>
            </Link>
            <h1 className="text-lg font-semibold">八股闪记卡 · SRS</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs flex items-center gap-1 border px-2 py-1.5 rounded-lg">
              <input type="checkbox" checked={reviewMode} onChange={e => setReviewMode(e.target.checked)} />
              复习模式（间隔重复）
            </label>
            {!reviewMode && (
              <>
                <button onClick={() => { setRandomMode(true); nextRandom(); }}
                        className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:shadow-sm">随机抽题</button>
                <button onClick={() => { setRandomMode(false); nextSeq(); }}
                        className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:shadow-sm">下一题</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        {/* Filter */}
        <div id="filter-panel" className="rounded-2xl border bg-white p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">限定领域（多选）：</span>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <label key={tag} className={"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer " + (selectedTags.includes(tag) ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50")}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      setSelectedTags(s => e.target.checked ? [...s, tag] : s.filter(x => x !== tag));
                    }}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setSelectedTags([])} className="ml-auto text-xs underline">清空筛选</button>
          </div>
        </div>

        {/* Card Panel */}
        <div className="rounded-2xl border shadow-sm overflow-hidden bg-white">
          <div className="px-5 pt-5 pb-3 text-sm text-slate-600 flex items-center justify-between">
            <div>题库：{filtered.length} 条；模式：{reviewMode ? "复习（SRS）" : (randomMode ? "练习·随机" : "练习·顺序")}</div>
            <div className="text-xs text-slate-500">空格：揭示答案；R：随机/抽题；N：下一题</div>
          </div>
          <div className="px-4 pb-3">
            <AnimatePresence mode="wait" initial={false}>
              {current ? (
                <Flashcard
                  key={current.id + (revealed ? "_r" : "_h")}
                  card={current}
                  revealed={revealed}
                  onToggle={() => setRevealed(r => !r)}
                />
              ) : (
                <div className="p-10 text-center text-slate-500">
                  没有匹配的题目，请调整筛选或添加自定义卡片。
                </div>
              )}
          </AnimatePresence>

          </div>

          {/* Rating bar (after reveal) */}
          <div className="px-4 pb-5">
            <div className="rounded-xl border bg-slate-50 p-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-600 mr-1">熟练度/信心评分：</span>
              <button disabled={!current} onClick={() => rate("again")} className="px-3 py-1.5 rounded-lg text-xs border hover:shadow-sm bg-white">Again</button>
              <button disabled={!current} onClick={() => rate("hard")}  className="px-3 py-1.5 rounded-lg text-xs border hover:shadow-sm bg-white">Hard</button>
              <button disabled={!current} onClick={() => rate("good")}  className="px-3 py-1.5 rounded-lg text-xs border hover:shadow-sm bg-white">Good</button>
              <button disabled={!current} onClick={() => rate("easy")}  className="px-3 py-1.5 rounded-lg text-xs border hover:shadow-sm bg-white">Easy</button>
              <span className="ml-auto text-xs text-slate-500">当前卡 SRS：间隔 {current && srs[current.id]?.interval ? (srs[current.id].interval.toFixed(2) + " 天") : "未建立"}，EF {current && srs[current.id]?.ef ? srs[current.id].ef.toFixed(2) : "-"}</span>
            </div>
          </div>
        </div>

        {/* Import / Export & Custom editor */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4">
            <h2 className="text-base font-semibold mb-3">导入 / 导出题库</h2>
            <div className="flex items-center gap-3">
              <input type="file" accept="application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJSON(f); }} />
              <button onClick={exportJSON} className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:shadow-sm">导出自定义题库</button>
            </div>
            <p className="text-xs text-slate-500 mt-2">说明：只导入/导出自定义题库（localStorage），内置题库不随导出。</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <h2 className="text-base font-semibold mb-3">自定义闪记卡（本地）</h2>
            <CardEditor onAdd={(q,a,t)=>addCustom(q,a,t)} onClearAll={clearCustom} />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <h2 className="text-base font-semibold mb-3">统计（最近 {N} 次）</h2>
          <div className="text-sm text-slate-600 mb-3">命中率（Good/Easy）：<span className="font-semibold">{acc}%</span>；样本数：{recent.length}</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-slate-500 mb-2">滚动命中率趋势</div>
              <canvas ref={accCanvasRef} style={{width:"100%", height:160}} />
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-slate-500 mb-2">揭示耗时分布</div>
              <canvas ref={histCanvasRef} style={{width:"100%", height:160}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Flashcard with fog overlay
function Flashcard({
  card, revealed, onToggle,
}: { card: Card; revealed: boolean; onToggle: () => void; }) {
  return (
    <motion.div
      onClick={onToggle}
      className="relative cursor-pointer select-none rounded-2xl border bg-white/80 p-5 min-h-[260px] shadow-sm hover:shadow-md transition"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{ perspective: 1200 }}
    >
      {/* 背景高光 */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 300px at 20% -20%, rgba(99,102,241,0.16), transparent 60%)," +
            "radial-gradient(600px 300px at 120% 0%, rgba(16,185,129,0.12), transparent 60%)",
        }}
      />
      {/* 3D 容器 */}
      <motion.div
        className="relative h-full"
        style={{ transformStyle: "preserve-3d" as any }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Front: Question */}
        <div
          className="absolute inset-0 rounded-xl p-5"
          style={{ backfaceVisibility: "hidden" as any, transform: "rotateY(0deg)" }}
        >
          <div className="text-xs text-slate-500 mb-2 flex flex-wrap gap-2">
            {card.tags.map(t => (
              <span key={t} className="inline-flex items-center rounded-full border px-2 py-0.5">{t}</span>
            ))}
          </div>
          <div className="text-xl font-semibold leading-relaxed whitespace-pre-wrap">
            {card.question}
          </div>
          <div className="absolute bottom-4 left-0 right-0 mx-auto w-fit text-slate-500 text-xs">
            点击/空格 以揭示答案
          </div>
        </div>

        {/* Back: Answer */}
        <div
          className="absolute inset-0 rounded-xl p-5"
          style={{ backfaceVisibility: "hidden" as any, transform: "rotateY(180deg)" }}
        >
          <div className="text-xs text-slate-500 mb-2">答案</div>
          <div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
            {card.answer}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Editor
function CardEditor({ onAdd, onClearAll }: { onAdd: (q: string, a: string, tags: string[]) => void; onClearAll: () => void; }) {
  const qRef = React.useRef<HTMLTextAreaElement | null>(null);
  const aRef = React.useRef<HTMLTextAreaElement | null>(null);
  const tRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">题目</label>
        <textarea ref={qRef} rows={5} className="w-full rounded-lg border p-2 text-sm" placeholder="输入题目"></textarea>
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">答案</label>
        <textarea ref={aRef} rows={5} className="w-full rounded-lg border p-2 text-sm" placeholder="输入答案"></textarea>
      </div>
      <div className="md:col-span-1">
        <label className="block text-xs text-slate-500 mb-1">标签（用英文逗号分隔）</label>
        <input ref={tRef} className="w-full rounded-lg border p-2 text-sm" placeholder="如：计算机网络,TCP"/>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              const q = qRef.current?.value ?? "";
              const a = aRef.current?.value ?? "";
              const tags = (tRef.current?.value ?? "").split(",").map(s => s.trim()).filter(Boolean);
              onAdd(q, a, tags);
              if (qRef.current) qRef.current.value = "";
              if (aRef.current) aRef.current.value = "";
              if (tRef.current) tRef.current.value = "";
            }}
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:shadow-sm"
          >添加</button>
          <button onClick={onClearAll} className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:shadow-sm">清空自定义</button>
        </div>
      </div>
    </div>
  );
}


