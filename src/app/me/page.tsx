"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProgress, getLevel, getStage, BUILD_VERSION } from "@/lib/her-start/use-progress";
import { BottomNav } from "@/components/her-start/bottom-nav";
import { BadgeSeal } from "@/components/her-start/brand-icons";
import { BrandReport } from "@/components/her-start/brand-report";

export default function MePage() {
  const router = useRouter();
  const { progress, reset, loaded } = useProgress();
  const [showReport, setShowReport] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!loaded) {
    return (
      <div className="app-shell">
        <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>加载中…</div>
      </div>
    );
  }

  const stage = getStage(progress);
  const level = getLevel(progress.points);
  const hasResult = Boolean(progress.result);

  function reanalyze() {
    reset();
    router.push("/interview");
  }

  // 未完成状态
  if (!hasResult) {
    return (
      <div className="app-shell">
        <main className="page-content">
          <h1 className="section-title">我的</h1>
          <div className="me-empty">
            <div className="me-empty-title">你还没有开局成果</div>
            <p className="me-empty-desc">先完成第一关，让 Value Mirror 照见你走过的路。</p>
            <Link href="/interview" className="btn btn-primary btn-full" style={{ maxWidth: "260px" }}>现在开始</Link>
          </div>
          <div className="me-info">
            比赛体验版报告保存在当前浏览器中。清理浏览器数据后可能无法恢复，请及时保存长图。
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const r = progress.result!;

  return (
    <div className="app-shell">
      <main className="page-content">
        <h1 className="section-title">我的</h1>

        {/* 统计 */}
        <div className="me-stat-row">
          <div className="me-stat">
            <div className="me-stat-val">{progress.points}</div>
            <div className="me-stat-lbl">经验值</div>
          </div>
          <div className="me-stat">
            <div className="me-stat-val">Lv{level.level}</div>
            <div className="me-stat-lbl">{level.name}</div>
          </div>
        </div>

        {/* 徽章 */}
        <div className="me-badge-row">
          <BadgeSeal size={44} />
          <div>
            <div style={{ fontSize: "12px", color: "#76633D" }}>已解锁徽章</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#4D3D1F" }}>{r.actionCard.badge}</div>
          </div>
        </div>

        {/* 人生资产卡摘要 */}
        <div className="me-section">
          <div className="me-section-title">人生资产卡</div>
          <div className="me-section-row"><span className="me-section-label">价值定位</span><span className="me-section-value">{r.lifeAssetCard.valuePositioning}</span></div>
          {r.lifeAssetCard.assets.map((a, i) => (
            <div className="me-section-row" key={i}>
              <span className="me-section-label">资产{i + 1}</span>
              <span className="me-section-value">{a.name} · {a.formedAbility}</span>
            </div>
          ))}
          <div className="me-section-row"><span className="me-section-label">核心能力</span><span className="me-section-value">{r.lifeAssetCard.coreTransferableAbility}</span></div>
        </div>

        {/* 最小产品卡摘要 */}
        <div className="me-section">
          <div className="me-section-title">最小产品卡</div>
          <div className="me-section-row"><span className="me-section-label">产品名称</span><span className="me-section-value">{r.minimumProductCard.productName}</span></div>
          <div className="me-section-row"><span className="me-section-label">目标用户</span><span className="me-section-value">{r.minimumProductCard.targetUser}</span></div>
          <div className="me-section-row"><span className="me-section-label">交付方式</span><span className="me-section-value">{r.minimumProductCard.delivery}</span></div>
          <div className="me-section-row"><span className="me-section-label">测试价格</span><span className="me-section-value" style={{ color: "var(--gold)", fontWeight: 600 }}>{r.minimumProductCard.testPrice}</span></div>
        </div>

        {/* 行动卡摘要 */}
        <div className="me-section">
          <div className="me-section-title">24小时行动卡</div>
          {r.actionCard.actions.map((a, i) => (
            <div className="me-section-row" key={i}>
              <span className="me-section-label">行动{i + 1}</span>
              <span className="me-section-value">{a.task}（{a.estimatedMinutes}分钟）</span>
            </div>
          ))}
        </div>

        {/* 报告时间 */}
        {progress.createdAt && (
          <div className="me-info">
            报告生成时间：{new Date(progress.createdAt).toLocaleString("zh-CN")}
          </div>
        )}

        <div className="me-info">
          比赛体验版报告保存在当前浏览器中。清理浏览器数据后可能无法恢复，请及时保存长图。
        </div>

        {/* 操作按钮 */}
        <div className="me-actions">
          <Link href="/result" className="btn btn-secondary btn-full">查看完整报告</Link>
          <button className="btn btn-primary btn-full" onClick={() => setShowPrivacy(true)}>
            保存品牌长图
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => setShowPrivacy(true)}>
            分享开局成果
          </button>
          <button className="btn btn-ghost btn-full" onClick={reanalyze}>重新分析</button>
          <button className="btn btn-ghost btn-full" onClick={() => {
            if (confirm("确定要重置本次体验吗？这将清除你的所有回答和报告，但不影响浏览器其他数据。")) {
              reset();
              window.location.href = "/";
            }
          }}>重置本次体验</button>
        </div>

        {/* 版本号 */}
        <div style={{ textAlign: "center", padding: "16px 20px 24px", fontSize: "12px", color: "var(--text-sub)" }}>
          Build {BUILD_VERSION}
        </div>
      </main>
      <BottomNav />

      {showPrivacy && (
        <PrivacyConfirm
          onConfirm={() => { setShowPrivacy(false); setShowReport(true); }}
          onClose={() => setShowPrivacy(false)}
        />
      )}

      {showReport && (
        <BrandReport
          result={r}
          points={progress.points}
          createdAt={progress.createdAt}
          displayName={progress.displayName}
          showNameInReport={progress.showNameInReport}
          isDemo={progress.mode === "demo" || progress.isDemo}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function PrivacyConfirm({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="report-modal" onClick={onClose}>
      <div className="report-modal-inner" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "350px" }}>
        <div style={{ padding: "24px 20px 20px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>保存前确认</h3>
          <p style={{ fontSize: "14px", color: "var(--text-sub)", lineHeight: 1.65, marginBottom: "20px" }}>
            报告将展示提炼后的结果，不会展示你的完整回答。保存或分享前，请确认其中没有你不希望公开的信息。
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>取消</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onConfirm}>确认并继续</button>
          </div>
        </div>
      </div>
    </div>
  );
}
