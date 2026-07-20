"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProgress, getStage, getProgressPercent, getLevel, resetAllProgress } from "@/lib/her-start/use-progress";
import { ValueMirrorLogo } from "@/components/her-start/brand-icons";
import { BottomNav } from "@/components/her-start/bottom-nav";

export default function HomePage() {
  const { progress, loaded, reset } = useProgress();
  const router = useRouter();
  const stage = getStage(progress);
  const percent = getProgressPercent(stage);
  const level = getLevel(progress.points);

  if (!loaded) {
    return (
      <div className="app-shell">
        <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>加载中…</div>
      </div>
    );
  }

  const completed = stage === "completed";

  function startNew() {
    reset();
    router.push("/interview");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <main id="main-content" className="page-content">
        {/* 顶部品牌栏 */}
        <header className="brand-header">
          <div className="brand-text">
            <span className="brand-name">她来开局</span>
            <span className="brand-sub">HER START · VALUE MIRROR</span>
          </div>
          <span className="brand-logo"><ValueMirrorLogo size={40} /></span>
        </header>

        {/* 主视觉卡 */}
        <section className="hero-card">
          <div className="hero-kicker">VALUE MIRROR · 价值镜</div>
          <div className="hero-title">看见你走过的路<br />做成你的第一个产品</div>
          <p className="hero-desc">用约3分钟，重新发现被你低估的人生资产，并获得第一份最小产品和24小时市场行动。</p>
          <div className="hero-progress">
            <div className="hero-progress-bar">
              <div className="hero-progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="hero-progress-text">{percent}%</span>
          </div>
        </section>

        {/* 当前开局任务 */}
        <section className="task-card">
          <div className="task-eyebrow">当前开局任务</div>
          <div className="task-title">第一关 · 看见自己</div>
          <p className="task-desc">完成4个问题，让 Value Mirror 从你的经历中找到3项核心人生资产。</p>
          {stage === "idle" && (
            <button onClick={startNew} className="btn btn-primary btn-full">开始照见我的人生资产</button>
          )}
          {stage === "interviewing" && (
            <>
              <Link href="/interview" className="btn btn-primary btn-full">继续开局</Link>
              <button onClick={startNew} className="btn btn-ghost btn-full" style={{ marginTop: 12 }}>重新开始</button>
            </>
          )}
          {stage === "needs_followup" && !completed && (
            <Link href="/interview" className="btn btn-primary btn-full">继续完成分析</Link>
          )}
          {completed && (
            <>
              <Link href="/result" className="btn btn-primary btn-full">查看我的开局成果</Link>
              <button onClick={startNew} className="btn btn-ghost btn-full" style={{ marginTop: 12 }}>开始新的照见</button>
            </>
          )}
        </section>

        {/* 数据卡 */}
        <section className="stat-row">
          <div className="stat-card">
            <div className="stat-label">当前经验值</div>
            <div className="stat-value">{progress.points}</div>
            <div className="stat-sub">/ 100</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">当前等级</div>
            <div className="stat-value">Lv{level.level}</div>
            <div className="stat-sub">{level.name}</div>
          </div>
        </section>

        {/* 成果提示 */}
        <div className="hint-bar">
          {completed
            ? "已解锁「开局行动者」徽章"
            : "你走过的路，正在等待被重新看见。"}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
