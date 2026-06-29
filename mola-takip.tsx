import { useState, useEffect, useRef } from "react";

const TOTAL_SECONDS = 40 * 60;

function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, "0");
  const s = (Math.abs(seconds) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatClock(date) {
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function parseInput(val) {
  if (!val) return null;
  const str = val.trim();
  if (str.includes(":")) {
    const [m, s] = str.split(":").map(Number);
    if (isNaN(m) || isNaN(s)) return null;
    return m * 60 + s;
  }
  if (str.includes(".")) {
    const f = parseFloat(str);
    if (isNaN(f)) return null;
    return Math.round(f * 60);
  }
  const n = parseInt(str, 10);
  if (isNaN(n)) return null;
  return n * 60;
}

export default function MolaTakip() {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [activeStart, setActiveStart] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => r - 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleAddManual = () => {
    setError("");
    const secs = parseInput(input);
    if (secs === null || secs <= 0) {
      setError("Geçerli bir süre girin. Örnek: 10, 5:30");
      return;
    }
    if (secs > remaining) {
      setError(`Kalan süreyi (${formatTime(remaining)}) aşamazsınız!`);
      return;
    }
    const now = new Date();
    const startDate = new Date(now.getTime() - secs * 1000);
    setSessions((prev) => [
      ...prev,
      { type: "manuel", label: formatTime(secs), secs, startedAt: startDate, endedAt: now },
    ]);
    setRemaining((r) => r - secs);
    setInput("");
  };

  const handleStartLive = () => {
    if (remaining <= 0) return;
    setRunning(true);
    setActiveStart(new Date());
  };

  const handleStopLive = () => {
    setRunning(false);
    const now = new Date();
    const elapsed = activeStart ? Math.round((now - activeStart) / 1000) : 0;
    if (elapsed > 0) {
      setSessions((prev) => [
        ...prev,
        { type: "canlı", label: formatTime(elapsed), secs: elapsed, startedAt: activeStart, endedAt: now },
      ]);
    }
    setActiveStart(null);
  };

  const handleReset = () => {
    setRunning(false);
    setActiveStart(null);
    setRemaining(TOTAL_SECONDS);
    setSessions([]);
    setInput("");
    setError("");
  };

  const pct = Math.max(0, (remaining / TOTAL_SECONDS) * 100);
  const overused = remaining < 0;

  const ringColor = overused
    ? "#ef4444"
    : remaining < 5 * 60
    ? "#f97316"
    : remaining < 15 * 60
    ? "#eab308"
    : "#22c55e";

  const circumference = 2 * Math.PI * 54;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "32px 16px",
        fontFamily: "'Inter', sans-serif",
        color: "#f1f5f9",
      }}
    >
      <h1
        style={{
          fontSize: "13px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: "8px",
          fontWeight: 600,
        }}
      >
        Mola Takip
      </h1>

      {/* Ring */}
      <div style={{ position: "relative", width: 140, height: 140, margin: "8px 0 20px" }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s, stroke 0.5s" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: overused ? "20px" : "28px",
              fontWeight: 700,
              color: overused ? "#ef4444" : "#f1f5f9",
              lineHeight: 1,
            }}
          >
            {overused ? "-" + formatTime(-remaining) : formatTime(remaining)}
          </span>
          <span style={{ fontSize: "11px", color: "#64748b", marginTop: 4 }}>
            kalan
          </span>
        </div>
      </div>

      {/* Active mola indicator */}
      {running && activeStart && (
        <div
          style={{
            background: "#052e16",
            border: "1px solid #22c55e",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#86efac",
            fontSize: "13px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ animation: "blink 1s infinite" }}>●</span>
          Mola başladı — {formatClock(activeStart)}
        </div>
      )}

      {overused && (
        <div
          style={{
            background: "#450a0a",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#fca5a5",
            fontSize: "13px",
            marginBottom: 12,
          }}
        >
          ⚠️ 40 dakika limitini aştınız!
        </div>
      )}

      {/* Live timer controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {!running ? (
          <button
            onClick={handleStartLive}
            disabled={remaining <= 0}
            style={{
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: remaining <= 0 ? "not-allowed" : "pointer",
              opacity: remaining <= 0 ? 0.5 : 1,
            }}
          >
            ▶ Molayı Başlat
          </button>
        ) : (
          <button
            onClick={handleStopLive}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              animation: "pulse 1s infinite",
            }}
          >
            ⏹ Molayı Bitir
          </button>
        )}
        <button
          onClick={handleReset}
          style={{
            background: "#1e293b",
            color: "#94a3b8",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ↺ Sıfırla
        </button>
      </div>

      {/* Divider */}
      <div style={{ color: "#334155", fontSize: "12px", marginBottom: 14, width: "100%", maxWidth: 340, textAlign: "center" }}>
        — ya da süreyi manuel girin —
      </div>

      {/* Manual input */}
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 340, marginBottom: 6 }}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
          placeholder="Dakika (ör: 10 ya da 5:30)"
          style={{
            flex: 1,
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#f1f5f9",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={handleAddManual}
          style={{
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Ekle
        </button>
      </div>

      {error && (
        <div style={{ color: "#f87171", fontSize: "12px", marginBottom: 8 }}>{error}</div>
      )}

      {/* Sessions list */}
      {sessions.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 340,
            marginTop: 16,
            background: "#1e293b",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#475569",
              borderBottom: "1px solid #0f172a",
            }}
          >
            Mola Geçmişi
          </div>
          {sessions.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "10px 16px",
                borderBottom: i < sessions.length - 1 ? "1px solid #0f172a" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  #{i + 1} — {s.type}
                </span>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#f1f5f9" }}>
                  {s.label}
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: "11px", color: "#475569" }}>
                {formatClock(s.startedAt)}
                {" "}→{" "}
                {formatClock(s.endedAt)}
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "#0f172a",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#64748b" }}>Toplam kullanılan</span>
            <span style={{ fontWeight: 700, color: ringColor }}>
              {formatTime(TOTAL_SECONDS - Math.max(0, remaining))}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
