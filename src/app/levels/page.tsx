"use client";

import Link from "next/link";
import { useProgress, getStage } from "@/lib/her-start/use-progress";
import { BottomNav } from "@/components/her-start/bottom-nav";

export default function LevelsPage() {
  const { progress, loaded } = useProgress();
  const stage = getStage(progress);

  if (!loaded) {
    return (
      <div className="app-shell">
        <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>加载中…</div>
      </div>
    );
  }

  const lvl1Done = stage === "completed" || stage === "followup" || stage === "analyzing";
  const lvl1Active = stage === "interviewing";
  const lvl2Unlocked = lvl1Done;
  const lvl3Unlocked = stage === "completed";

  return (
    <div className="app-shell">
      <main className="page-content">
        <h1 className="section-title">我的开局地图</h1>
        <p className="section-desc">从人生经历出发，做成第一个可以验证的最小产品。</p>

        {/* 第一关 */}
        <article className="level-card">
          <div className="level-header">
            <div className="level-number">01</div>
            <div className="level-info">
              <div className="level-name">看见自己</div>
              <div className={`level-status ${lvl1Done ? "done" : lvl1Active ? "active" : ""}`}>
                {lvl1Done ? "已完成" : lvl1Active ? "进行中" : "未开始"}
                {lvl1Done ? " · +20经验值" : ""}
              </div>
            </div>
          </div>
          <p className="level-body">完成4个核心问题，梳理经历、外部认可、长期意愿和现实条件。</p>
          <div className="level-reward">
            <span className="reward-tag">+20 经验值</span>
            <span className="reward-tag">人生资产卡</span>
          </div>
          {stage === "not-started" && (
            <Link href="/interview" className="btn btn-primary btn-full">开始关卡</Link>
          )}
          {lvl1Active && (
            <Link href="/interview" className="btn btn-primary btn-full">继续回答</Link>
          )}
          {lvl1Done && (
            <Link href="/result" className="btn btn-secondary btn-full">查看回答</Link>
          )}
        </article>

        {/* 第二关 */}
        <article className={`level-card${lvl2Unlocked ? "" : " locked"}`}>
          <div className="level-header">
            <div className="level-number">02</div>
            <div className="level-info">
              <div className="level-name">做成产品</div>
              <div className={`level-status ${stage === "completed" ? "done" : lvl1Done ? "active" : "locked"}`}>
                {stage === "completed" ? "已完成" : lvl1Done ? "进行中" : "需先完成第一关"}
                {stage === "completed" ? " · +60经验值" : ""}
              </div>
            </div>
          </div>
          <p className="level-body">Value Mirror 从你的回答中提炼3项人生资产，生成第一个最小产品。</p>
          <div className="level-reward">
            <span className="reward-tag">人生资产卡 +30</span>
            <span className="reward-tag">最小产品卡 +30</span>
          </div>
          {stage === "completed" ? (
            <Link href="/result" className="btn btn-secondary btn-full">查看产品卡</Link>
          ) : (
            <button className="btn btn-ghost btn-full" disabled>需先完成第一关</button>
          )}
        </article>

        {/* 第三关 */}
        <article className={`level-card${lvl3Unlocked ? "" : " locked"}`}>
          <div className="level-header">
            <div className="level-number">03</div>
            <div className="level-info">
              <div className="level-name">走向市场</div>
              <div className={`level-status ${stage === "completed" ? "done" : "locked"}`}>
                {stage === "completed" ? "已完成 · +20经验值" : "需先完成第二关"}
              </div>
            </div>
          </div>
          <p className="level-body">领取未来24小时行动卡，至少完成一次真实用户验证。</p>
          <div className="level-reward">
            <span className="reward-tag">+20 经验值</span>
            <span className="reward-tag">「开局行动者」徽章</span>
          </div>
          {stage === "completed" ? (
            <Link href="/result" className="btn btn-secondary btn-full">查看行动卡</Link>
          ) : (
            <button className="btn btn-ghost btn-full" disabled>需先完成第二关</button>
          )}
        </article>
      </main>
      <BottomNav />
    </div>
  );
}
