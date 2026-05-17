import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from "recharts";

/* ============================================================
   Annie 成长合伙人 — Growth Garden
   一个温暖、有成长感的 10 岁女孩成长陪伴应用
   ============================================================ */

// ── 工具函数 ──────────────────────────────────────────────
const STORAGE_KEY = "annie_growth_data";
const today = () => new Date().toISOString().slice(0, 10);
const weekKey = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().slice(0, 10);
};
const formatDate = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
const dayName = (d) => ["日", "一", "二", "三", "四", "五", "六"][new Date(d).getDay()];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { days: {}, achievements: [], health: {} };
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const DIMENSIONS = [
  { key: "learning", label: "学习进步", icon: "📚", color: "#E07B5E", gradient: "linear-gradient(135deg, #FDE8E0, #FCE4D6)", hint: "今天学到了什么新东西？" },
  { key: "interest", label: "兴趣发展", icon: "🎨", color: "#8BA888", gradient: "linear-gradient(135deg, #E8F0E9, #DFEDE2)", hint: "画画、书法、游泳有进步吗？" },
  { key: "social", label: "社交成长", icon: "🤝", color: "#B8A9C9", gradient: "linear-gradient(135deg, #F0ECF5, #EBE4F2)", hint: "今天和朋友相处得怎么样？" },
  { key: "life", label: "生活技能", icon: "🌱", color: "#C9A96E", gradient: "linear-gradient(135deg, #F7F1E5, #F3EBD8)", hint: "自己做了什么力所能及的事？" },
  { key: "character", label: "品格发展", icon: "⭐", color: "#D4A574", gradient: "linear-gradient(135deg, #FDF3E5, #FBEBD5)", hint: "今天坚持了什么？诚实了吗？" },
];

const MOODS = [
  { key: "great", emoji: "😄", label: "超开心" },
  { key: "good", emoji: "🙂", label: "还不错" },
  { key: "ok", emoji: "😐", label: "一般般" },
  { key: "down", emoji: "😔", label: "有点低落" },
  { key: "sad", emoji: "😢", label: "不开心" },
];

// ── 庆祝粒子动画 ──────────────────────────────────────────
function Celebration({ show, onDone }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDone, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!show) return null;

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.2 + Math.random() * 1.5,
    size: 6 + Math.random() * 10,
    color: ["#E07B5E", "#8BA888", "#B8A9C9", "#F4C542", "#F08A7D", "#7EB5A6"][Math.floor(Math.random() * 6)],
    shape: Math.random() > 0.5 ? "circle" : "star",
  }));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "40%",
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `particleFloat ${p.duration}s ${p.delay}s ease-out forwards`,
          }}
        />
      ))}
      <div style={{
        background: "white", borderRadius: 24, padding: "32px 48px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        textAlign: "center", zIndex: 1,
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌟</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#4A3728", marginBottom: 4 }}>
          太棒了！
        </div>
        <div style={{ fontSize: 15, color: "#8B7355" }}>
          今天的进步已经记录下来啦
        </div>
      </div>
    </div>
  );
}

// ── 导航栏 ────────────────────────────────────────────────
function NavBar({ view, setView }) {
  const tabs = [
    { key: "daily", label: "今日打卡", icon: "✏️" },
    { key: "garden", label: "我的花园", icon: "🌸" },
    { key: "achievements", label: "成就银行", icon: "🏆" },
    { key: "report", label: "每周报告", icon: "📊" },
  ];

  return (
    <nav style={{
      display: "flex", justifyContent: "center", gap: 4,
      padding: "12px 16px",
      background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setView(t.key)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 50,
            border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: view === t.key ? 700 : 500,
            background: view === t.key ? "#FFF0E6" : "transparent",
            color: view === t.key ? "#E07B5E" : "#8B7355",
            transition: "all 0.25s ease",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ display: window.innerWidth < 480 ? "none" : "inline" }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── 心情选择器 ────────────────────────────────────────────
function MoodPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      {MOODS.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "12px 16px", borderRadius: 16,
            border: value === m.key ? `2px solid #E07B5E` : "2px solid transparent",
            background: value === m.key ? "#FFF0E6" : "#F8F5F0",
            cursor: "pointer", transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 28 }}>{m.emoji}</span>
          <span style={{
            fontSize: 12, fontWeight: value === m.key ? 600 : 400,
            color: value === m.key ? "#E07B5E" : "#8B7355",
          }}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── 维度打卡卡片 ──────────────────────────────────────────
function DimensionCard({ dim, data, onToggle, onNote }) {
  const hasProgress = data?.progress || false;
  const note = data?.note || "";

  return (
    <div style={{
      background: hasProgress ? dim.gradient : "#F8F5F0",
      borderRadius: 20, padding: "20px 24px",
      border: hasProgress ? `2px solid ${dim.color}30` : "2px solid transparent",
      transition: "all 0.3s ease",
      cursor: "pointer",
      boxShadow: hasProgress ? `0 4px 20px ${dim.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{dim.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#4A3728" }}>{dim.label}</div>
            <div style={{ fontSize: 12, color: "#A08C7A", marginTop: 2 }}>{dim.hint}</div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `2px solid ${hasProgress ? dim.color : "#D4C5B2"}`,
            background: hasProgress ? dim.color : "transparent",
            color: hasProgress ? "white" : "#B8A590",
            fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s ease",
          }}
          title={hasProgress ? "已打卡，点击取消" : "点击打卡"}
        >
          {hasProgress ? "✓" : "+"}
        </button>
      </div>

      {/* 备注输入 */}
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="记下具体进步了什么..."
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 12,
            border: "1px solid #E8DFD5", background: "white",
            fontSize: 13, color: "#4A3728",
            outline: "none", boxSizing: "border-box",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => e.target.style.borderColor = dim.color}
          onBlur={(e) => e.target.style.borderColor = "#E8DFD5"}
        />
      </div>
    </div>
  );
}

// ── 每日打卡页 ────────────────────────────────────────────
function DailyCheckin({ data, setData }) {
  const [showCelebration, setShowCelebration] = useState(false);
  const dateKey = today();
  const dayData = data.days[dateKey] || {};
  const allChecked = DIMENSIONS.every((d) => dayData[d.key]?.progress);

  const updateDimension = (key, field, value) => {
    setData((prev) => {
      const next = { ...prev };
      if (!next.days[dateKey]) next.days[dateKey] = {};
      if (!next.days[dateKey][key]) next.days[dateKey][key] = {};
      next.days[dateKey][key][field] = value;
      next.days[dateKey][key].date = dateKey;
      return next;
    });
  };

  const toggleProgress = (key) => {
    const current = dayData[key]?.progress || false;
    updateDimension(key, "progress", !current);

    // 检查是否全部打卡完成
    const willAllChecked = DIMENSIONS.every((d) =>
      d.key === key ? !current : (dayData[d.key]?.progress || false)
    );
    if (willAllChecked) {
      setShowCelebration(true);
      // 自动添加成就
      setData((prev) => {
        const next = { ...prev };
        const achievement = {
          date: dateKey,
          type: "all_checked",
          description: `完成了${formatDate(dateKey)}的全部五项打卡！`,
          icon: "🌟",
        };
        const exists = next.achievements?.some(
          (a) => a.date === dateKey && a.type === "all_checked"
        );
        if (!exists) {
          next.achievements = [...(next.achievements || []), achievement];
        }
        return next;
      });
    }
  };

  const updateMood = (mood) => {
    setData((prev) => {
      const next = { ...prev };
      if (!next.health) next.health = {};
      if (!next.health[dateKey]) next.health[dateKey] = {};
      next.health[dateKey].mood = mood;
      return next;
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 40px" }}>
      <Celebration show={showCelebration} onDone={() => setShowCelebration(false)} />

      {/* 日期标题 */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: "#A08C7A", marginBottom: 4, letterSpacing: 1 }}>
          星期{dayName(dateKey)}
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: "#4A3728", margin: 0,
          letterSpacing: -0.5,
        }}>
          {formatDate(dateKey)}
        </h1>
        <div style={{
          marginTop: 12, fontSize: 14, color: "#8B7355",
          background: "linear-gradient(135deg, #FFF8F0, #FFF0E6)",
          display: "inline-block", padding: "6px 20px", borderRadius: 50,
        }}>
          {allChecked ? "🎉 今天的你已经很棒了！" : "今天有什么进步呢？"}
        </div>
      </div>

      {/* 心情选择 */}
      <div style={{
        background: "white", borderRadius: 20, padding: "20px 24px",
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#4A3728", marginBottom: 12 }}>
          今天心情怎么样？
        </div>
        <MoodPicker
          value={data.health?.[dateKey]?.mood || null}
          onChange={updateMood}
        />
      </div>

      {/* 维度打卡 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DIMENSIONS.map((dim) => (
          <DimensionCard
            key={dim.key}
            dim={dim}
            data={dayData[dim.key]}
            onToggle={() => toggleProgress(dim.key)}
            onNote={(note) => updateDimension(dim.key, "note", note)}
          />
        ))}
      </div>

      {/* 今日已完成提示 */}
      {allChecked && (
        <div style={{
          marginTop: 24, textAlign: "center",
          padding: "24px", borderRadius: 20,
          background: "linear-gradient(135deg, #F5F2F8, #FFF0E6)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#4A3728", marginBottom: 4 }}>
            今天的五项打卡全部完成！
          </div>
          <div style={{ fontSize: 14, color: "#8B7355" }}>
            记得去「我的花园」看看今天种下的种子 🌱
          </div>
        </div>
      )}
    </div>
  );
}

// ── 花园视图 ──────────────────────────────────────────────
function Garden({ data }) {
  const sortedDays = useMemo(() => {
    return Object.keys(data.days || {}).sort((a, b) => b.localeCompare(a));
  }, [data.days]);

  const recentDays = sortedDays.slice(0, 42); // 最近6周

  const getGrowthStage = (dayData) => {
    if (!dayData) return 0;
    const count = DIMENSIONS.filter((d) => dayData[d.key]?.progress).length;
    return count;
  };

  const totalFlowers = recentDays.reduce((sum, d) => {
    return sum + getGrowthStage(data.days[d]);
  }, 0);

  const streakDays = useMemo(() => {
    let streak = 0;
    const todayDate = today();
    for (let i = 0; i < 365; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayData = data.days[key];
      if (dayData && DIMENSIONS.some((dim) => dayData[dim.key]?.progress)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [data.days]);

  // SVG 花朵组件
  const Flower = ({ stage, x, y, size = 40, day }) => {
    if (stage === 0) return (
      <g>
        <circle cx={x} cy={y + size * 0.7} r={size * 0.18} fill="#E8DFD5" opacity={0.5} />
        <text x={x} y={y + size * 0.75} textAnchor="middle" fontSize={size * 0.22} fill="#C4B5A5">
          🌰
        </text>
      </g>
    );

    const colors = ["#FDE8E0", "#E8F0E9", "#F0ECF5", "#F7F1E5", "#FDF3E5"];
    const flowerColors = ["#E07B5E", "#8BA888", "#B8A9C9", "#C9A96E", "#D4A574"];
    const petals = stage;

    return (
      <g>
        {/* 茎 */}
        <line x1={x} y1={y + size * 0.6} x2={x} y2={y + size * 0.7} stroke="#8BA888" strokeWidth={1.5} opacity={0.6} />
        {/* 花瓣 */}
        {Array.from({ length: petals }, (_, i) => {
          const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
          const px = x + Math.cos(angle) * size * 0.25;
          const py = y + Math.sin(angle) * size * 0.25;
          return (
            <circle key={i} cx={px} cy={py} r={size * 0.12} fill={flowerColors[stage - 1]} opacity={0.8} />
          );
        })}
        {/* 花心 */}
        <circle cx={x} cy={y} r={size * 0.1} fill="#F4C542" />
        {/* 叶子 */}
        {stage >= 3 && (
          <>
            <ellipse cx={x + size * 0.18} cy={y + size * 0.55} rx={size * 0.13} ry={size * 0.07} fill="#8BA888" opacity={0.5} transform={`rotate(-30 ${x + size * 0.18} ${y + size * 0.55})`} />
            <ellipse cx={x - size * 0.18} cy={y + size * 0.45} rx={size * 0.13} ry={size * 0.07} fill="#8BA888" opacity={0.5} transform={`rotate(30 ${x - size * 0.18} ${y + size * 0.45})`} />
          </>
        )}
        {/* 日期标签 */}
        {day && (
          <text x={x} y={y + size * 0.9} textAnchor="middle" fontSize={size * 0.2} fill="#A08C7A">
            {day.slice(5)}
          </text>
        )}
      </g>
    );
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 40px" }}>
      {/* 花园统计 */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#4A3728", margin: "0 0 8px" }}>
          🌸 Annie 的成长花园
        </h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{
            background: "white", borderRadius: 16, padding: "14px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#E07B5E" }}>{totalFlowers}</div>
            <div style={{ fontSize: 11, color: "#A08C7A" }}>总花朵数</div>
          </div>
          <div style={{
            background: "white", borderRadius: 16, padding: "14px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#8BA888" }}>{streakDays}</div>
            <div style={{ fontSize: 11, color: "#A08C7A" }}>连续打卡天数</div>
          </div>
          <div style={{
            background: "white", borderRadius: 16, padding: "14px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#B8A9C9" }}>{recentDays.length}</div>
            <div style={{ fontSize: 11, color: "#A08C7A" }}>记录天数</div>
          </div>
        </div>
      </div>

      {/* SVG 花园 */}
      <div style={{
        background: "linear-gradient(180deg, #FDFCF8 0%, #F0EDE4 100%)",
        borderRadius: 24, padding: 24,
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
      }}>
        <svg viewBox="0 0 560 320" style={{ width: "100%", height: "auto" }}>
          {/* 地面 */}
          <ellipse cx={280} cy={290} rx={260} ry={30} fill="#E8E0D0" opacity={0.5} />
          <rect x={0} y={280} width={560} height={40} fill="#F0EDE4" opacity={0.3} />

          {recentDays.slice(0, 21).map((day, i) => {
            const cols = 7;
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = 60 + col * 72;
            const y = 50 + row * 110;
            const stage = getGrowthStage(data.days[day]);
            return (
              <Flower key={day} stage={stage} x={x} y={y} size={36} day={day} />
            );
          })}
        </svg>
      </div>

      {recentDays.length === 0 && (
        <div style={{
          textAlign: "center", padding: 40, color: "#A08C7A",
          fontSize: 15, lineHeight: 1.8,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          花园还是空的呢<br />
          快去「今日打卡」种下第一颗种子吧！
        </div>
      )}

      {/* 鼓励语 */}
      {streakDays >= 7 && (
        <div style={{
          marginTop: 24, textAlign: "center",
          padding: "20px", borderRadius: 20,
          background: "linear-gradient(135deg, #E8F0E9, #F0ECF5)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#4A3728" }}>
            🎉 你已经连续打卡 {streakDays} 天了！
          </div>
          <div style={{ fontSize: 13, color: "#6B8B6E", marginTop: 4 }}>
            每一天的努力都让花园更美丽
          </div>
        </div>
      )}
    </div>
  );
}

// ── 成就银行 ──────────────────────────────────────────────
function AchievementBank({ data, setData }) {
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("progress");
  const achievements = (data.achievements || []).slice().reverse();

  const addAchievement = () => {
    if (!newDesc.trim()) return;
    setData((prev) => ({
      ...prev,
      achievements: [
        ...(prev.achievements || []),
        {
          date: today(),
          type: newType,
          description: newDesc.trim(),
          icon: newType === "brave_try" ? "🦋" : newType === "progress" ? "⭐" : "💝",
        },
      ],
    }));
    setNewDesc("");
  };

  const typeLabels = {
    progress: "进步时刻",
    brave_try: "勇气尝试",
    milestone: "特别里程碑",
    all_checked: "全勤打卡",
  };

  const typeIcons = {
    progress: "⭐",
    brave_try: "🦋",
    milestone: "💝",
    all_checked: "🌟",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#4A3728", margin: "0 0 4px" }}>
          🏆 成就银行
        </h2>
        <div style={{ fontSize: 13, color: "#A08C7A" }}>
          每一份努力都值得被记住
        </div>
      </div>

      {/* 添加成就 */}
      <div style={{
        background: "white", borderRadius: 20, padding: 20,
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#4A3728", marginBottom: 12 }}>
          记录一个新成就
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {Object.entries(typeLabels).filter(([k]) => k !== "all_checked").map(([key, label]) => (
            <button
              key={key}
              onClick={() => setNewType(key)}
              style={{
                padding: "8px 16px", borderRadius: 50,
                border: newType === key ? `2px solid #E07B5E` : "2px solid #E8DFD5",
                background: newType === key ? "#FFF0E6" : "transparent",
                cursor: "pointer", fontSize: 13, fontWeight: 500,
                color: newType === key ? "#E07B5E" : "#8B7355",
                fontFamily: "inherit",
              }}
            >
              {typeIcons[key]} {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAchievement()}
            placeholder="描述这个成就..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 12,
              border: "1px solid #E8DFD5", fontSize: 13,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={addAchievement}
            style={{
              padding: "10px 20px", borderRadius: 12,
              background: "#E07B5E", color: "white", border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            记录
          </button>
        </div>
      </div>

      {/* 成就列表 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {achievements.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#A08C7A", fontSize: 15 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏅</div>
            还没有记录成就<br />去完成今天的打卡吧！
          </div>
        )}
        {achievements.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            background: "white", borderRadius: 16, padding: "16px 20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#FFF8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {a.icon || typeIcons[a.type] || "⭐"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#4A3728", marginBottom: 2 }}>
                {a.description}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#A08C7A" }}>{formatDate(a.date)}</span>
                <span style={{
                  fontSize: 11, padding: "2px 10px", borderRadius: 50,
                  background: "#F0ECF5", color: "#8B7BA8",
                }}>
                  {typeLabels[a.type] || a.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 每周报告 ──────────────────────────────────────────────
function WeeklyReport({ data }) {
  const currentWeekKey = weekKey(today());

  const weekData = useMemo(() => {
    const monday = new Date(currentWeekKey);
    const days = [];
    const dimScores = { learning: 0, interest: 0, social: 0, life: 0, character: 0 };
    let activeDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const dayData = data.days[key] || {};
      const checked = DIMENSIONS.filter((dim) => dayData[dim.key]?.progress).length;
      const dayInfo = {
        date: key,
        label: `周${dayName(key)}`,
        checked,
        data: dayData,
      };
      days.push(dayInfo);
      if (checked > 0) {
        activeDays++;
        DIMENSIONS.forEach((dim) => {
          if (dayData[dim.key]?.progress) dimScores[dim.key]++;
        });
      }
    }

    // 上周数据用于对比
    const lastMonday = new Date(monday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastWeekKey = lastMonday.toISOString().slice(0, 10);
    let lastWeekActiveDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastMonday);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const dayData = data.days[key] || {};
      if (DIMENSIONS.some((dim) => dayData[dim.key]?.progress)) {
        lastWeekActiveDays++;
      }
    }

    return { days, dimScores, activeDays, lastWeekActiveDays, weekStart: currentWeekKey };
  }, [data.days, currentWeekKey]);

  const radarData = DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    value: weekData.dimScores[dim.key],
    fullMark: 7,
  }));

  // 本周亮点
  const highlights = useMemo(() => {
    const result = [];
    weekData.days.forEach((day) => {
      DIMENSIONS.forEach((dim) => {
        const note = day.data[dim.key]?.note;
        if (note && note.trim()) {
          result.push({ date: day.date, dim: dim.label, note: note.trim(), icon: dim.icon });
        }
      });
    });
    return result;
  }, [weekData.days]);

  // 鼓励消息
  const getMessage = () => {
    if (weekData.activeDays === 0) return { title: "新的一周开始了！", body: "这周是全新的开始，去「今日打卡」记录第一个进步吧 🌱" };
    if (weekData.activeDays <= 2) return { title: "好的开始！", body: "你已经迈出了第一步，继续保持这份节奏，不用急，慢慢来 😊" };
    if (weekData.activeDays <= 4) return { title: "稳步前进中！", body: "这周你已经坚持了大多数日子，这是很棒的进步！每一个小进步都在累积 💪" };
    if (weekData.activeDays <= 6) return { title: "超级棒的一周！", body: "几乎每天都在进步！你的努力正在开花结果，为你感到骄傲 🌸" };
    return { title: "完美一周！", body: "这周你每天都在进步，这是非常了不起的成就！记得给自己一个大大的拥抱 🎉🌟" };
  };

  const message = getMessage();

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#4A3728", margin: "0 0 4px" }}>
          📊 每周成长报告
        </h2>
        <div style={{ fontSize: 13, color: "#A08C7A" }}>
          {formatDate(weekData.weekStart)} 起的一周
        </div>
      </div>

      {/* 概览卡片 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{
          flex: "1 1 140px", background: "linear-gradient(135deg, #FFF0E6, #FDE8E0)",
          borderRadius: 20, padding: "20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#E07B5E" }}>{weekData.activeDays}</div>
          <div style={{ fontSize: 13, color: "#8B7355" }}>活跃天数</div>
        </div>
        <div style={{
          flex: "1 1 140px", background: "linear-gradient(135deg, #E8F0E9, #DFEDE2)",
          borderRadius: 20, padding: "20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#8BA888" }}>{highlights.length}</div>
          <div style={{ fontSize: 13, color: "#6B8B6E" }}>进步亮点</div>
        </div>
        <div style={{
          flex: "1 1 140px", background: "linear-gradient(135deg, #F0ECF5, #EBE4F2)",
          borderRadius: 20, padding: "20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#B8A9C9" }}>
            {weekData.lastWeekActiveDays > 0
              ? (weekData.activeDays >= weekData.lastWeekActiveDays ? "↑" : "↓")
              : "—"}
          </div>
          <div style={{ fontSize: 13, color: "#8B7BA8" }}>较上周</div>
        </div>
      </div>

      {/* 雷达图 */}
      <div style={{
        background: "white", borderRadius: 20, padding: "20px",
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#4A3728", marginBottom: 12 }}>
          各维度进步分布
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E8DFD5" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: "#8B7355", fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 7]} tick={{ fill: "#A08C7A", fontSize: 10 }} />
            <Radar name="本周" dataKey="value" stroke="#E07B5E" fill="#E07B5E" fillOpacity={0.3} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 每日进度条 */}
      <div style={{
        background: "white", borderRadius: 20, padding: "20px",
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#4A3728", marginBottom: 12 }}>
          每日进度
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
          {weekData.days.map((day) => (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", borderRadius: "8px 8px 0 0",
                height: day.checked > 0 ? `${(day.checked / 5) * 60}px` : "4px",
                background: day.checked > 0
                  ? `linear-gradient(180deg, #E07B5E, #F4A88A)`
                  : "#E8DFD5",
                transition: "height 0.3s ease",
                minHeight: 4,
              }} />
              <div style={{ fontSize: 10, color: "#A08C7A" }}>{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 本周亮点 */}
      {highlights.length > 0 && (
        <div style={{
          background: "white", borderRadius: 20, padding: "20px",
          marginBottom: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#4A3728", marginBottom: 12 }}>
            ✨ 本周亮点
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12,
                background: "#FFFBF5",
              }}>
                <span style={{ fontSize: 18 }}>{h.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "#4A3728", fontWeight: 500 }}>{h.note}</div>
                  <div style={{ fontSize: 11, color: "#A08C7A" }}>{h.dim} · {formatDate(h.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 鼓励消息 */}
      <div style={{
        textAlign: "center", padding: "28px 24px", borderRadius: 20,
        background: "linear-gradient(135deg, #FDF3E5, #F0ECF5)",
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#4A3728", marginBottom: 8 }}>
          {message.title}
        </div>
        <div style={{ fontSize: 14, color: "#8B7355", lineHeight: 1.6 }}>
          {message.body}
        </div>
      </div>
    </div>
  );
}

// ── 主应用 ────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(() => loadData());
  const [view, setView] = useState("daily");

  // 数据变更时自动保存
  useEffect(() => {
    saveData(data);
  }, [data]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFFBF5",
      fontFamily: "'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', system-ui, sans-serif",
      color: "#4A3728",
      WebkitFontSmoothing: "antialiased",
    }}>
      {/* 全局样式 */}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(0.2); opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #FFFBF5; }
        ::selection { background: #FDE8E0; color: #4A3728; }
        input::placeholder { color: #C4B5A5; }
        button:hover { opacity: 0.85; }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* 顶部品牌 */}
      <header style={{
        textAlign: "center", padding: "28px 16px 8px",
        background: "linear-gradient(180deg, #FFF8F0 0%, #FFFBF5 100%)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: 600,
          color: "#A08C7A", letterSpacing: 1,
        }}>
          <span>🌻</span>
          <span>Annie 成长合伙人</span>
        </div>
      </header>

      <NavBar view={view} setView={setView} />

      <main>
        {view === "daily" && <DailyCheckin data={data} setData={setData} />}
        {view === "garden" && <Garden data={data} />}
        {view === "achievements" && <AchievementBank data={data} setData={setData} />}
        {view === "report" && <WeeklyReport data={data} />}
      </main>

      {/* 底部 */}
      <footer style={{
        textAlign: "center", padding: "32px 16px",
        fontSize: 11, color: "#C4B5A5",
      }}>
        数据仅保存在本设备 · 仅供家长参考 · 最终决定权在家长
      </footer>
    </div>
  );
}
