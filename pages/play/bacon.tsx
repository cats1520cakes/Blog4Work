import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Bacon Toss v4
 * - Fix: Back Home icon size forced via width/height attrs + shrink-0 to avoid global CSS inflation.
 * - Feature: Bottom touch = FAIL (no bounce). Left/Top/Right still bounce.
 * - Adds "Fails" counter. Score on pan touch with immediate respawn.
 */

type Vec = { x: number; y: number };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const hypot = Math.hypot;

export default function BaconToss() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [fails, setFails] = useState(0);
  const [msg, setMsg] = useState<string>("拖拽以发射（方向=拖拽方向）");

  const stateRef = useRef({
    dpr: 1,
    w: 900,
    h: 560,
    lastT: 0,

    gravity: 220,
    airDrag: 0.9994,
    angDrag: 0.997,
    restitution: 0.86,
    wallThickness: 10,
    respawnDelayMs: 600,

    box: { x: 60, y: 70, w: 780, h: 380 },
    pan: { x: 560, y: 300, w: 170, h: 26, r: 12 },

    bacon: {
      pos: { x: 150, y: 300 } as Vec,
      vel: { x: 0, y: 0 } as Vec,
      angle: 0,
      angVel: 0,
      w: 140,
      h: 22,
      radius: Math.hypot(140/2, 22/2),
      grabbed: false,
      atRest: true,
      launchFrom: { x: 150, y: 300 } as Vec,
      visible: true,
    },

    input: {
      dragging: false,
      dragStart: { x: 0, y: 0 } as Vec,
      dragEnd: { x: 0, y: 0 } as Vec,
    },

    scoredThisThrow: false,
    respawnPending: false,
  });

  // Resize / DPR
  useEffect(() => {
    const cvs = canvasRef.current!;
    const s = stateRef.current;

    const resize = () => {
      const parent = cvs.parentElement!;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      s.dpr = dpr;
      const targetW = Math.min(rect.width, 980);
      const targetH = Math.max(420, (targetW * 10) / 16);
      s.w = Math.floor(targetW);
      s.h = Math.floor(targetH);

      // Inner box with margins
      const marginX = Math.max(48, s.w * 0.06);
      const marginTop = 72;
      const marginBottom = 120;
      s.box = { x: marginX, y: marginTop, w: s.w - marginX * 2, h: s.h - (marginTop + marginBottom) };

      // Pan position
      s.pan.x = s.box.x + s.box.w * 0.62;
      s.pan.y = s.box.y + s.box.h * 0.55;

      cvs.style.width = `${s.w}px`;
      cvs.style.height = `${s.h}px`;
      cvs.width = Math.floor(s.w * dpr);
      cvs.height = Math.floor(s.h * dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs.parentElement!);
    return () => ro.disconnect();
  }, []);

  // Input (pointer) — same-direction launch
  useEffect(() => {
    const cvs = canvasRef.current!;
    const s = stateRef.current;

    const toLocal = (evt: PointerEvent): Vec => {
      const rect = cvs.getBoundingClientRect();
      return { x: (evt.clientX - rect.left), y: (evt.clientY - rect.top) };
    };

    const onDown = (e: PointerEvent) => {
      const b = s.bacon;
      if (!b.visible) return;
      const p = toLocal(e);
      if (hypot(p.x - b.pos.x, p.y - b.pos.y) <= b.radius) {
        s.input.dragging = true;
        s.input.dragStart = p;
        s.input.dragEnd = p;
        b.grabbed = true;
        setMsg("拉动决定力度与方向（方向=拖拽方向）");
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!s.input.dragging) return;
      s.input.dragEnd = toLocal(e);
    };
    const onUp = () => {
      const b = s.bacon;
      if (!s.input.dragging || !b.grabbed) return;
      s.input.dragging = false;
      b.grabbed = false;

      // Launch velocity in SAME direction as drag (start -> end)
      const dx = (s.input.dragEnd.x - s.input.dragStart.x);
      const dy = (s.input.dragEnd.y - s.input.dragStart.y);
      const dist = Math.max(1, hypot(dx, dy));
      const power = Math.min(2800, dist * 10.5);
      const scale = (power / dist) * 0.0036;
      b.vel.x = dx * scale * 60;
      b.vel.y = dy * scale * 60;
      b.angVel = (Math.random() - 0.5) * 6;
      b.atRest = false;

      stateRef.current.scoredThisThrow = false;
      setShots(s => s + 1);
      setMsg("飞行中… 碰到平底锅得分；触底失败");
    };

    cvs.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    cvs.addEventListener("contextmenu", e => e.preventDefault());
    return () => {
      cvs.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const reset = () => {
    const s = stateRef.current;
    s.bacon.pos = { ...s.bacon.launchFrom };
    s.bacon.vel = { x: 0, y: 0 };
    s.bacon.angle = 0;
    s.bacon.angVel = 0;
    s.bacon.atRest = true;
    s.bacon.visible = true;
    s.scoredThisThrow = false;
    s.respawnPending = false;
    setMsg("拖拽以发射（方向=拖拽方向）");
  };

  const scheduleRespawn = (afterMsg?: string) => {
    const s = stateRef.current;
    if (s.respawnPending) return;
    s.respawnPending = true;
    window.setTimeout(() => {
      s.bacon.pos = { ...s.bacon.launchFrom };
      s.bacon.vel = { x: 0, y: 0 };
      s.bacon.angle = 0;
      s.bacon.angVel = 0;
      s.bacon.atRest = true;
      s.bacon.visible = true;
      s.respawnPending = false;
      setMsg(afterMsg ?? "新培根已就位，继续！");
    }, s.respawnDelayMs);
  };

  // Simulation
  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const s = stateRef.current;

    const step = (t: number) => {
      const dpr = s.dpr;
      if (!s.lastT) s.lastT = t;
      const dt = Math.min(0.033, (t - s.lastT) / 1000);
      s.lastT = t;

      const b = s.bacon;
      const box = s.box;

      // Integrate
      if (b.visible && (!b.atRest || b.grabbed)) {
        if (!b.grabbed) {
          b.vel.y += s.gravity * dt;
          b.vel.x *= s.airDrag;
          b.vel.y *= s.airDrag;
          b.pos.x += b.vel.x * dt;
          b.pos.y += b.vel.y * dt;
          b.angle += b.angVel * dt;
          b.angVel *= s.angDrag;
        } else {
          const dx = s.input.dragEnd.x - b.pos.x;
          const dy = s.input.dragEnd.y - b.pos.y;
          b.angle = Math.atan2(dy, dx);
        }

        // collisions with Left/Top/Right walls -> bounce
        const r = b.radius;
        // Left
        if (b.pos.x - r < box.x) {
          b.pos.x = box.x + r;
          b.vel.x = Math.abs(b.vel.x) * s.restitution;
        }
        // Right
        if (b.pos.x + r > box.x + box.w) {
          b.pos.x = box.x + box.w - r;
          b.vel.x = -Math.abs(b.vel.x) * s.restitution;
        }
        // Top
        if (b.pos.y - r < box.y) {
          b.pos.y = box.y + r;
          b.vel.y = Math.abs(b.vel.y) * s.restitution;
        }
        // Bottom -> FAIL (no bounce)
        if (b.pos.y + r > box.y + box.h) {
          // mark fail, hide, respawn
          b.visible = false;
          setFails(f => f + 1);
          setMsg("触底失败，重生中…");
          scheduleRespawn("继续挑战！");
        }
      }

      // Scoring: touch pan -> score + respawn
      const pan = s.pan;
      if (b.visible && circleIntersectsRect(b.pos.x, b.pos.y, b.radius, pan.x, pan.y, pan.w, pan.h) && !s.scoredThisThrow) {
        s.scoredThisThrow = true;
        setScore(v => v + 1);
        setMsg("命中！马上重生…");
        b.visible = false;
        scheduleRespawn();
      }

      // Render
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, s.w, s.h);

      drawBackdrop(ctx, s.w, s.h);
      drawFrame(ctx, box, s.wallThickness);
      drawPan(ctx, pan);
      if (b.visible) {
        drawBacon(ctx, b.pos.x, b.pos.y, b.w, b.h, b.angle);
      }

      if (s.input.dragging && b.visible) {
        drawAimGuide(ctx, s.input.dragStart.x, s.input.dragStart.y, s.input.dragEnd.x, s.input.dragEnd.y);
      }

      drawHUD(ctx, s.w, score, shots, fails, msg);
      ctx.restore();

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, shots, fails, msg]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header (fixed icon sizing) */}
      <div className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-[1100px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:shadow-sm">
              {/* Force icon size with attrs; prevent flex growth */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   className="inline-block align-middle shrink-0"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="inline-block align-middle">返回主页</span>
            </Link>
            <h1 className="text-lg font-semibold">Bacon Toss v4</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">Score: {score}</span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">Shots: {shots}</span>
            <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-medium">Fails: {fails}</span>
            <button onClick={reset} className="ml-2 inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:shadow-sm">重置（R）</button>
          </div>
        </div>
      </div>

      {/* Canvas Card */}
      <div className="mx-auto max-w-[1100px] px-4 py-6">
        <div className="rounded-2xl border shadow-sm overflow-hidden bg-white">
          <div className="px-5 pt-5 pb-3 text-sm text-slate-600">
            规则：拖拽方向=发射方向；左/上/右边框可反弹，<b>触底判定失败</b>；碰到平底锅即可得分（立即重生）。
          </div>
          <div className="px-2 pb-4">
            <div className="rounded-xl border bg-white overflow-hidden">
              <canvas ref={canvasRef} className="block w-full h-[60vh] min-h-[380px] touch-none select-none"/>
            </div>
          </div>
          <div className="px-5 pb-5 text-xs text-slate-500">{msg}</div>
        </div>
      </div>
    </div>
  );
}

// ---- Drawing helpers ----

function drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#f2f6ff");
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(ctx: CanvasRenderingContext2D, box: {x:number;y:number;w:number;h:number}, t: number) {
  ctx.save();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = t;
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawPan(ctx: CanvasRenderingContext2D, pan: {x:number;y:number;w:number;h:number;r:number}) {
  ctx.save();
  const {x,y,w,h,r} = pan;
  ctx.fillStyle = "#3b3f47";
  roundRect(ctx, x, y - h/2, w, h, r);
  ctx.fill();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#dbeafe";
  roundRect(ctx, x, y - h/2, w, 6, r);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#2b2f36";
  ctx.fillRect(x + w - 10, y - 6, 86, 12);
  ctx.restore();
}

function drawBacon(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const segs = 16;
  const half = w / 2;
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = -half + t * w;
    const y = Math.sin(t * Math.PI * 3) * 6;
    if (i === 0) ctx.moveTo(x, y - h/2);
    ctx.lineTo(x, y - h/2);
  }
  for (let i = segs; i >= 0; i--) {
    const t = i / segs;
    const x = -half + t * w;
    const y = Math.sin(t * Math.PI * 3) * 6;
    ctx.lineTo(x, y + h/2);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(-half, 0, half, 0);
  g.addColorStop(0.0, "#a94435");
  g.addColorStop(0.2, "#c75a44");
  g.addColorStop(0.5, "#f3c9a9");
  g.addColorStop(0.8, "#c75a44");
  g.addColorStop(1.0, "#a94435");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawAimGuide(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, w: number, score: number, shots: number, fails: number, msg: string) {
  ctx.save();
  ctx.font = "14px ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillStyle = "#111";
  const pad = 12;
  ctx.globalAlpha = 0.9;
  ctx.fillText(`Score: ${score}`, pad, 22);
  ctx.fillText(`Shots: ${shots}`, pad + 110, 22);
  ctx.fillText(`Fails: ${fails}`, pad + 220, 22);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#334155";
  ctx.fillText(msg, pad, 44);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// Circle-rect intersection (rect is centered at ry vertically)
function circleIntersectsRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
  const left = rx, top = ry - rh/2, right = rx + rw, bottom = ry + rh/2;
  const closestX = clamp(cx, left, right);
  const closestY = clamp(cy, top, bottom);
  const dx = cx - closestX, dy = cy - closestY;
  return (dx*dx + dy*dy) <= r*r;
}
