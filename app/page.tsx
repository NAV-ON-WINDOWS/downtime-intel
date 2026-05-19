"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TICKER_START = 80_000;
const TICKER_INCREMENT = 47; // rupees per second added

// azure-rf-v2 real confidence values
const MACHINES = [
  {
    name: "Hydraulic Press",
    line: "Line B — Forging",
    risk: "Critical",
    confidence: 9,
    exposure: "₹2,12,421",
    failureDate: "22 / 05 / 2026",
    window: "± 2 days",
    color: "#ef4444",
    glowColor: "rgba(239,68,68,0.45)",
    badgeColor: "#ef4444",
  },
  {
    name: "CNC Grinding — Line A",
    line: "Ball Screw Production",
    risk: "High",
    confidence: 9,
    exposure: "₹1,84,500",
    failureDate: "25 / 05 / 2026",
    window: "± 3 days",
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.4)",
    badgeColor: "#f97316",
  },
  {
    name: "CMM Inspection — QC",
    line: "Quality Control",
    risk: "Low",
    confidence: 1,
    exposure: "₹18,400",
    failureDate: "15 / 06 / 2026",
    window: "± 7 days",
    color: "#22c55e",
    glowColor: "rgba(34,197,94,0.3)",
    badgeColor: "#22c55e",
  },
];

const PROOF_BARS = [
  { label: "Hydraulic Press", risk: "Critical", pct: 9, color: "#ef4444" },
  { label: "CNC Grinding", risk: "High", pct: 9, color: "#f97316" },
  { label: "Lathe — Line 2 (HMT)", risk: "Low", pct: 5, color: "#eab308" },
  { label: "CMM Inspection", risk: "Low", pct: 1, color: "#22c55e" },
];

// ─── Utility hooks ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, decimals = 0) {
  const [value, setValue] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((ease * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, decimals]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); },
      { threshold: 0.2 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [start]);

  return { value, elRef };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${p.opacity})`;
        ctx.fill();
      });

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(127,119,221,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

function TypewriterHeadline() {
  const text = "Your machines are bleeding money. We can fix that for you.";
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const idx = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else if (!done.current) {
        done.current = true;
        // blink cursor twice then hide
        setTimeout(() => setShowCursor(false), 1200);
      }
    }, 38);
    return () => clearInterval(interval);
  }, []);

  return (
    <h1
      style={{
        fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
        fontWeight: 225,
        lineHeight: 1.08,
        letterSpacing: "-0.03em",
        color: "#fff",
        fontFamily: "'Syne', 'Inter', sans-serif",
        margin: "0 0 1.5rem",
      }}
    >
      {displayed}
      {showCursor && (
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: "1em",
            background: "#ef4444",
            marginLeft: 4,
            verticalAlign: "middle",
            animation: "blink 0.7s step-end infinite",
          }}
        />
      )}
    </h1>
  );
}

function HeroCostTicker() {
  const [cost, setCost] = useState(TICKER_START);
  useEffect(() => {
    const id = setInterval(() => {
      setCost((c) => c + TICKER_INCREMENT + Math.floor(Math.random() * 20));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = cost.toLocaleString("en-IN");
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 10,
        padding: "10px 18px",
        fontSize: "0.95rem",
        color: "rgba(255,255,255,0.7)",
        marginBottom: "2rem",
        backdropFilter: "blur(8px)",
      }}
    >
      Indian manufacturing loses{" "}
      <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "1.05rem", fontVariantNumeric: "tabular-nums" }}>
        ₹{fmt}
      </span>{" "}
      every second to unplanned downtime
    </div>
  );
}

function HeroDashboardCard() {
  const [barWidth, setBarWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate confidence bar after mount
    const timer = setTimeout(() => setBarWidth(9), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        background: "rgba(18,18,22,0.92)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 16,
        padding: "1.5rem",
        boxShadow: "0 0 60px rgba(239,68,68,0.08), 0 24px 80px rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        minWidth: 300,
        maxWidth: 440,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 4 }}>MACHINE</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>CNC Grinding Machine — Line A</div>
        </div>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 8, padding: "4px 10px",
            animation: "pulseBadge 2s ease-in-out infinite",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700, letterSpacing: "0.06em" }}>Critical Risk</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.2rem" }}>
        {[
          { label: "PREDICTED FAILURE", value: "19 / 05 / 2026" },
          { label: "WINDOW", value: "± 3 days" },
        ].map((item) => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1.2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Confidence</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444" }}>9%</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%", background: "linear-gradient(90deg,#ef4444,#dc2626)",
              borderRadius: 99, width: `${barWidth}%`,
              transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL COST EXPOSURE</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ef4444", letterSpacing: "-0.02em" }}>₹3,68,257</div>
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>last 90 days</div>
      </div>
    </div>
  );
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function MachineCard({ machine, index }: { machine: typeof MACHINES[0]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTimeout(() => setBarWidth(machine.confidence), index * 150 + 300); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [machine.confidence, index]);

  const riskLabel = machine.risk.toUpperCase() + " RISK";
  const pulseAnim = machine.risk === "Critical" ? "pulseBadge 1.8s ease-in-out infinite"
    : machine.risk === "High" ? "pulseOrange 2.2s ease-in-out infinite"
    : "none";

  return (
    <div
      ref={ref}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{ perspective: 1000, flex: "1 1 280px", minWidth: 240 }}
    >
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          height: 220,
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            background: "rgba(24,24,28,0.95)",
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 16, padding: "1.4rem",
            boxShadow: flipped ? "none" : `0 0 30px ${machine.glowColor}`,
            transition: "box-shadow 0.4s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /><line x1="12" y1="12" x2="12" y2="16" />
            </svg>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: machine.risk === "Critical" ? "rgba(239,68,68,0.15)" : machine.risk === "High" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.1)",
              border: `1px solid ${machine.badgeColor}44`,
              borderRadius: 20, padding: "3px 10px",
              animation: pulseAnim,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: machine.badgeColor, display: "inline-block" }} />
              <span style={{ fontSize: "0.62rem", color: machine.badgeColor, fontWeight: 700, letterSpacing: "0.08em" }}>{riskLabel}</span>
            </div>
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{machine.name}</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>{machine.line}</div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>Confidence</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: machine.color }}>{machine.confidence}%</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: machine.color,
                borderRadius: 99, width: `${barWidth}%`,
                transition: "width 1.6s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
          </div>
          <div style={{ marginTop: "0.8rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
            Predicted exposure: <span style={{ color: machine.color, fontWeight: 700 }}>{machine.exposure}</span>
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: `linear-gradient(135deg, rgba(24,24,28,0.98) 0%, ${machine.glowColor.replace("0.4", "0.12")} 100%)`,
            border: `1px solid ${machine.badgeColor}55`,
            borderRadius: 16, padding: "1.4rem",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 6 }}>PREDICTION DETAILS</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: machine.color, marginBottom: 8 }}>{machine.exposure}</div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Failure window: {machine.window}<br />
            Predicted: {machine.failureDate}<br />
            Model: Azure RF v2<br />
            Confidence: {machine.confidence}%
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCounter({ target, prefix = "", suffix = "", label, decimals = 0, delay = 0 }: {
  target: number; prefix?: string; suffix?: string; label: string; decimals?: number; delay?: number;
}) {
  const { value, elRef } = useCountUp(target, 1800, decimals);
  const fmt = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString("en-IN");
  return (
    <div ref={elRef} style={{ textAlign: "center", padding: "0 1rem" }}>
      <div style={{
        fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fff",
        letterSpacing: "-0.03em", marginBottom: 6,
        fontFamily: "'Syne', 'Inter', sans-serif",
      }}>
        {prefix}{fmt}{suffix}
      </div>
      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ProofBar({ label, risk, pct, color, delay }: { label: string; risk: string; pct: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTimeout(() => setWidth(pct), delay); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, delay]);

  return (
    <div ref={ref} style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "0.78rem", color, fontWeight: 700 }}>{risk} · {pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: color, borderRadius: 99,
          width: `${width}%`, transition: `width 1.4s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        }} />
      </div>
    </div>
  );
}

// ─── Dashboard Preview Section ────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <section style={{ padding: "6rem 2rem", background: "rgba(10,10,13,1)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#7F77DD", marginBottom: "0.8rem" }}>
              WHAT YOU GET INSIDE
            </div>
            <h2 style={{
              fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fff",
              letterSpacing: "-0.03em", lineHeight: 1.1,
              fontFamily: "'Syne', 'Inter', sans-serif",
            }}>
              Your actual dashboard.<br />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>Live on Vercel right now.</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div style={{
            background: "rgba(18,18,22,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 0 80px rgba(239,68,68,0.06), 0 40px 120px rgba(0,0,0,0.8)",
          }}>
            {/* Browser chrome */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316", opacity: 0.7 }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />
              <div style={{
                flex: 1, textAlign: "center", fontSize: "0.72rem",
                color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em",
              }}>
                downtime-intel.vercel.app/dashboard/machines/0b00d0ad-06c3-46fd
              </div>
            </div>

            {/* Dashboard content */}
            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>← Back to machines</div>
                  <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", margin: 0 }}>CNC Grinding Machine</h3>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Line A — Ball Screw Production</div>
                </div>
                <button style={{
                  background: "#ef4444", color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 20px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                  boxShadow: "0 0 20px rgba(239,68,68,0.4)",
                }}>Run Prediction</button>
              </div>

              {/* Prediction result */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "1.2rem", marginBottom: "1rem",
              }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff", marginBottom: 8 }}>Prediction Result</div>
                <div style={{
                  display: "inline-block", background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 6, padding: "4px 12px", fontSize: "0.75rem",
                  color: "#ef4444", fontWeight: 600,
                }}>High Risk · 9% Confidence</div>
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
                {[
                  { label: "Total Cost", value: "₹3,68,257", sub: "All time" },
                  { label: "Total Events", value: "23", sub: "All time" },
                  { label: "Avg Duration", value: "135 min", sub: "All time" },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, padding: "1.2rem",
                  }}>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: 2 }}>{stat.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cost over time chart */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "1.2rem",
              }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", marginBottom: "1rem" }}>Cost Over Time</div>
                <svg viewBox="0 0 600 160" style={{ width: "100%", height: 140 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Y-axis labels */}
                  {[26000, 19500, 13000, 6500].map((v, i) => (
                    <text key={v} x="0" y={i * 40 + 15} fill="rgba(255,255,255,0.25)" fontSize="9">₹{(v / 1000).toFixed(0)}k</text>
                  ))}
                  <path
                    d="M50,120 L90,60 L130,100 L170,85 L220,35 L270,55 L310,40 L360,50 L400,65 L440,45 L480,75 L520,60 L560,90"
                    fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <path
                    d="M50,120 L90,60 L130,100 L170,85 L220,35 L270,55 L310,40 L360,50 L400,65 L440,45 L480,75 L520,60 L560,90 L560,155 L50,155 Z"
                    fill="url(#chartGrad)"
                  />
                </svg>
              </div>
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={250}>
          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>
            Real dashboard · Real data · Pune precision manufacturer · downtime-intel.vercel.app
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll helper
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #09090c;
          color: #fff;
          font-family: 'DM Sans', 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50% { box-shadow: 0 0 14px 4px rgba(239,68,68,0.45); }
        }
        @keyframes pulseOrange {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
          50% { box-shadow: 0 0 14px 4px rgba(249,115,22,0.4); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .shimmer-btn {
          position: relative; overflow: hidden;
          background: #ef4444; color: #fff;
          border: none; border-radius: 10px;
          padding: 14px 28px; font-size: 0.95rem;
          font-weight: 700; cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .shimmer-btn::after {
          content: '';
          position: absolute; top: 0; left: 0;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          animation: shimmer 3s infinite;
        }
        .shimmer-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 0 32px rgba(239,68,68,0.55);
        }

        .ghost-btn {
          background: transparent;
          color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          padding: 14px 28px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .ghost-btn:hover {
          border-color: rgba(255,255,255,0.5);
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(239,68,68,0.12);
        }

        .pricing-card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pricing-card-hover:hover {
          transform: translateY(-6px);
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #09090c; }
        ::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 99px; }

        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .machines-grid { flex-direction: column !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .pricing-grid { flex-direction: column !important; align-items: center !important; }
          .proof-grid { flex-direction: column !important; }
          .steps-grid { flex-direction: column !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 64,
        background: navScrolled ? "rgba(9,9,12,0.85)" : "transparent",
        backdropFilter: navScrolled ? "blur(20px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.35s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>
            Downtime Intel
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {["problem", "how-it-works", "dashboard", "pricing"].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", fontWeight: 500,
                transition: "color 0.2s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              {id.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
  
        <button
          className="ghost-btn"
          style={{ padding: "8px 16px", fontSize: "0.85rem" }}
        >
          Sign in
        </button>

        <Link
          href="/dashboard"
          className="shimmer-btn"
          style={{ padding: "8px 18px", fontSize: "0.85rem" }}
        >
          Start free
        </Link>
      </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <ParticleCanvas />
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(239,68,68,0.1) 0%, transparent 70%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "8rem 2rem 5rem", width: "100%" }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: "3rem", justifyContent: "space-between" }}>
            {/* Left */}
            <div style={{ flex: "0 0 auto", maxWidth: 580 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 99, padding: "5px 14px", marginBottom: "1.8rem",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulseBadge 2s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Predictive maintenance, decoded</span>
              </div>

              <TypewriterHeadline />

              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "1.8rem", maxWidth: 480 }}>
                Downtime Intel turns your machine downtime logs into rupee costs and failure predictions. Built for manufacturers who can&apos;t afford to guess.
              </p>

              <HeroCostTicker />

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/dashboard">
                  <button className="shimmer-btn">Start Free</button>
                </Link>
              </div>
            </div>

            {/* Right: dashboard card */}
            <div style={{ flex: "0 0 auto", animation: "float 4s ease-in-out infinite" }}>
              <HeroDashboardCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" style={{ padding: "7rem 2rem", background: "#0c0c10" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "3.5rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#ef4444", marginBottom: "0.8rem" }}>
                THE PROBLEM
              </div>
              <h2 style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                fontFamily: "'Syne', 'Inter', sans-serif",
              }}>
                Downtime isn&apos;t a hardware problem.<br />
                <span style={{ color: "rgba(255,255,255,0.3)" }}>It&apos;s an information problem.</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="steps-grid" style={{ display: "flex", gap: "1.2rem" }}>
            {[
              {
                icon: "M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3",
                title: "You don't know the real cost",
                desc: "Most factories track downtime in hours, not rupees. Every hour on a CNC grinding machine costs ₹7,130 in lost revenue, labour, and overhead.",
              },
              {
                icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
                title: "You react instead of predict",
                desc: "By the time a machine fails, the damage is done. You need to know 2 weeks before, not 2 hours after.",
              },
              {
                icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
                title: "Enterprise tools are out of reach",
                desc: "SAP PM costs ₹40L+ to implement. Your Excel sheet is costing you more in missed predictions.",
              },
            ].map((card, i) => (
              <ScrollReveal key={card.title} delay={i * 120}>
                <div
                  className="card-hover"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16, padding: "2rem",
                    height: "100%",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>{card.title}</h3>
                  <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{card.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "7rem 2rem", background: "#09090c" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#7F77DD", marginBottom: "0.8rem" }}>
                HOW IT WORKS
              </div>
              <h2 style={{
                fontSize: "clamp(2rem, 4.5vw, 3.5rem)", fontWeight: 900,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                fontFamily: "'Syne', 'Inter', sans-serif",
              }}>
                From spreadsheet to prediction<br />in 5 minutes
              </h2>
            </div>
          </ScrollReveal>

          <div className="steps-grid" style={{ display: "flex", gap: "1.2rem", position: "relative" }}>
            {[
              {
                num: "01", icon: "M4 6h16M4 10h16M4 14h10",
                title: "Add machines & cost rates",
                desc: "2 minutes setup. Define your machines and their hourly cost of downtime.",
                accent: "#7F77DD",
              },
              {
                num: "02", icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
                title: "Log downtime events",
                desc: "Manually or bulk upload via CSV. Connect to existing CMMS if you have one.",
                accent: "#7F77DD",
              },
              {
                num: "03", icon: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18",
                title: "Run the AI",
                desc: "Get risk level, failure window and confidence score for every machine — instantly.",
                accent: "#ef4444",
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 130}>
                <div
                  className="card-hover"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16, padding: "2rem", flex: 1,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `rgba(127,119,221,0.12)`, border: `1px solid rgba(127,119,221,0.25)`,
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.8">
                      <path d={step.icon} />
                    </svg>
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", marginBottom: 6 }}>{step.num}</div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>{step.title}</h3>
                  <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ padding: "5rem 2rem", background: "#0c0c10" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "3rem 2rem",
            }}
          >
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
              <StatCounter target={75} suffix="%" label="Prediction accuracy" />
              <StatCounter target={500000} prefix="₹" suffix="+" label="Avg. annual savings / machine" />
              <StatCounter target={8} label="Machine types supported" />
              <StatCounter target={299} label="Downtime events analysed" />
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DASHBOARD SHOWCASE ── */}
      <section id="dashboard" style={{ padding: "7rem 2rem", background: "#09090c" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ marginBottom: "3.5rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#ef4444", marginBottom: "0.8rem" }}>
                LIVE DASHBOARD
              </div>
              <h2 style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 900,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                fontFamily: "'Syne', 'Inter', sans-serif",
              }}>
                See every machine.<br />Ranked by risk and rupees.
              </h2>
            </div>
          </ScrollReveal>

          <div className="machines-grid" style={{ display: "flex", gap: "1.2rem", marginBottom: "1.5rem" }}>
            {MACHINES.map((m, i) => (
              <ScrollReveal key={m.name} delay={i * 120}>
                <MachineCard machine={m} index={i} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
              Run on real data from a Pune precision engineering manufacturer · Model: Azure RF v2
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW (actual screenshot recreation) ── */}
      <DashboardPreview />

      {/* ── PROOF SECTION ── */}
      <section style={{ padding: "7rem 2rem", background: "#09090c" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="proof-grid" style={{ display: "flex", gap: "4rem", alignItems: "center" }}>
            <div style={{ flex: "0 0 auto", maxWidth: 520 }}>
              <ScrollReveal>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#7F77DD", marginBottom: "0.8rem" }}>
                  PROOF
                </div>
                <h2 style={{
                  fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 900,
                  letterSpacing: "-0.03em", lineHeight: 1.15,
                  fontFamily: "'Syne', 'Inter', sans-serif", marginBottom: "1.5rem",
                }}>
                  6 months of data.<br />Zero surprise breakdowns.
                </h2>
                <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: "1rem" }}>
                  A Pune-based precision manufacturer ran Downtime Intel on six months of historical downtime logs. The model flagged the Hydraulic Press as Critical (9%) — which matched the highest actual failure rate on the floor. CNC Grinding was flagged High despite fewer events, because every breakdown was costing ₹16,000+ in lost revenue.
                </p>
                <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
                  Maintenance was scheduled proactively. The plant logged zero surprise breakdowns in the following month.
                </p>
              </ScrollReveal>
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <ScrollReveal delay={200}>
                <div style={{
                  background: "rgba(18,18,22,0.9)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "1.8rem",
                }}>
                  {PROOF_BARS.map((bar, i) => (
                    <ProofBar key={bar.label} {...bar} delay={i * 120} />
                  ))}
                  <div style={{
                    marginTop: "1.2rem", paddingTop: "1.2rem",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                    </svg>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                      42% reduction in unplanned downtime in month 7
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "7rem 2rem", background: "#0c0c10" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "#7F77DD", marginBottom: "0.8rem" }}>
                PRICING
              </div>
              <h2 style={{
                fontSize: "clamp(2rem, 4.5vw, 3.5rem)", fontWeight: 900,
                letterSpacing: "-0.03em", lineHeight: 1.1,
                fontFamily: "'Syne', 'Inter', sans-serif",
              }}>
                Built to pay for itself<br />in week one
              </h2>
            </div>
          </ScrollReveal>

          <div className="pricing-grid" style={{ display: "flex", gap: "1.2rem", justifyContent: "center" }}>
            {[
              {
                tier: "Starter", price: "Free", sub: "For evaluating the platform",
                features: ["3 machines", "Manual downtime logs", "Cost dashboard", "Email support"],
                cta: "Start Free", highlight: false,
              },
              {
                tier: "Growth", price: "₹4,999", period: "/month", sub: "For active manufacturing teams",
                features: ["Unlimited machines", "CSV bulk upload", "ML failure predictions", "Priority Slack alerts", "Weekly cost reports"],
                cta: "Start 14-day trial", highlight: true, badge: "MOST POPULAR",
              },
              {
                tier: "Enterprise", price: "Custom", sub: "For multi-plant operations",
                features: ["REST API access", "Multi-plant support", "Custom model training", "Dedicated success manager"],
                cta: "Talk to sales", highlight: false,
              },
            ].map((plan, i) => (
              <ScrollReveal key={plan.tier} delay={i * 100}>
                <div
                  className="pricing-card-hover"
                  style={{
                    position: "relative",
                    background: plan.highlight
                      ? "rgba(24,24,28,0.98)"
                      : "rgba(255,255,255,0.025)",
                    border: plan.highlight
                      ? "1px solid transparent"
                      : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 18,
                    padding: "2rem",
                    flex: "1 1 280px",
                    maxWidth: 340,
                    backgroundClip: plan.highlight ? "padding-box" : undefined,
                    boxShadow: plan.highlight
                      ? "0 0 0 1px #ef4444, 0 0 40px rgba(239,68,68,0.15)"
                      : undefined,
                  }}
                >
                  {plan.badge && (
                    <div style={{
                      position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                      background: "#ef4444", borderRadius: 99, padding: "3px 14px",
                      fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", color: "#fff",
                      whiteSpace: "nowrap",
                    }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "0.6rem" }}>{plan.tier}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "#fff", lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", paddingBottom: 6 }}>{plan.period}</span>}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", marginBottom: "1.5rem" }}>{plan.sub}</div>
                  <ul style={{ listStyle: "none", marginBottom: "1.8rem" }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "#ef4444" : "#22c55e"} strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.highlight ? (
                    <button className="shimmer-btn" style={{ width: "100%", textAlign: "center" }}>{plan.cta}</button>
                  ) : (
                    <button style={{
                      width: "100%", background: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                      padding: "12px", fontSize: "0.9rem", fontWeight: 600,
                      color: "rgba(255,255,255,0.7)", cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                      }}
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: "8rem 2rem",
        background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(150,0,0,0.35) 0%, rgba(9,9,12,1) 75%)",
        textAlign: "center",
      }}>
        <ScrollReveal>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900,
              letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: "1rem",
              fontFamily: "'Syne', 'Inter', sans-serif", color: "#fff",
            }}>
              Stop reacting.<br />
              <span style={{ color: "#ef4444" }}>Start predicting.</span>
            </h2>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem" }}>
              Every day without Downtime Intel is another day of preventable losses.
            </p>
              <Link
                href="/dashboard"
                className="shimmer-btn"
                style={{ fontSize: "1.05rem", padding: "16px 36px" }}
              >
                Start Free Today — No credit card required
              </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "2.5rem 2rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "#09090c",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.9rem" }}>Downtime Intel</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
              Built with Next.js · Powered by Random Forest ML · Supabase · Vercel
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", marginTop: 4 }}>© Downtime Intel 2026</div>
          </div>
          <div style={{ display: "flex", gap: "1.8rem" }}>
            {["Dashboard", "GitHub", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}