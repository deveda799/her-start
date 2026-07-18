"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProgress, getLevel } from "@/lib/her-start/use-progress";
import { BottomNav } from "@/components/her-start/bottom-nav";
import { BadgeSeal } from "@/components/her-start/brand-icons";
import { BrandReport } from "@/components/her-start/brand-report";

export default function ResultPage() {
  const router = useRouter();
  const { progress, update, reset, loaded } = useProgress();
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (loaded && !progress.result) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!loaded || !progress.result) {
    return (
      <div className="app-shell">
        <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>加载中…</div>
      </div>
    );
  }

  const r = progress.result;
  const level = getLevel(progress.points);

  function regenerate() {
    update({
      result: null,
      isDemo: false,
      points: 0,
      followupQuestion: null,
      followupAnswer: null,
      createdAt: null,
    });
    router.push("/interview");
  }

  function editAnswers() {
    router.push("/interview");
  }

  return (
    <div className="app-shell">
      <main className="page-content result-page">
        {/* 顶部 */}
        <div className="result-top">
          <div className="result-eyebrow">你的开局成果</div>
          <h1 className="result-title">你的人生资产，正在成为产品</h1>
          <div className="result-badge-bar">
            <span className="result-stat">{progress.points} 经验值</span>
            <span className="result-stat">Lv{level.level} {level.name}</span>
            <span className="result-stat">「开局行动者」徽章</span>
          </div>
        </div>

        {/* 演示提示 */}
        {progress.isDemo && (
          <div className="demo-banner" role="status">
            <strong>当前展示演示结果</strong>
            正式分析需要连接 AI 服务。这份案例不是针对你的真实分析。
          </div>
        )}

        {/* 人生资产卡 */}
        <article className="result-card asset">
          <header className="rc-header">
            <span className="rc-number">01</span>
            <div>
              <div className="rc-label">第一关 · 看见自己</div>
              <div className="rc-title">人生资产卡</div>
            </div>
          </header>
          <div className="rc-body">
            <p className="positioning">「{r.lifeAssetCard.valuePositioning}」</p>
            {r.lifeAssetCard.assets.map((asset, i) => (
              <div className="asset-item" key={i}>
                <div className="asset-name">0{i + 1} {asset.name}</div>
                <div className="asset-row"><span className="asset-label">经历来源</span><span className="asset-value">{asset.source}</span></div>
                <div className="asset-row"><span className="asset-label">形成能力</span><span className="asset-value">{asset.formedAbility}</span></div>
                <div className="asset-row"><span className="asset-label">可迁移价值</span><span className="asset-value">{asset.transferableValue}</span></div>
                <div className="asset-row"><span className="asset-label">事实依据</span><span className="asset-value">{asset.factEvidence}</span></div>
              </div>
            ))}
            <div className="card-insight">
              <div className="card-insight-label">核心可迁移能力</div>
              <div className="card-insight-text">{r.lifeAssetCard.coreTransferableAbility}</div>
            </div>
          </div>
        </article>

        {/* 最小产品卡 */}
        <article className="result-card product">
          <header className="rc-header">
            <span className="rc-number">02</span>
            <div>
              <div className="rc-label">第二关 · 做成产品</div>
              <div className="rc-title">最小产品卡</div>
            </div>
          </header>
          <div className="rc-body">
            <div className="product-hero">
              <small>唯一主商业路径</small>
              <h3>{r.minimumProductCard.productName}</h3>
              <p>{r.minimumProductCard.primaryPath}</p>
            </div>
            <div className="detail-grid">
              <div className="detail-row"><span className="detail-label">目标用户</span><span className="detail-value">{r.minimumProductCard.targetUser}</span></div>
              <div className="detail-row"><span className="detail-label">解决的问题</span><span className="detail-value">{r.minimumProductCard.problem}</span></div>
              <div className="detail-row"><span className="detail-label">交付方式</span><span className="detail-value">{r.minimumProductCard.delivery}</span></div>
              <div className="detail-row"><span className="detail-label">建议测试价格</span><span className="detail-value gold">{r.minimumProductCard.testPrice}</span></div>
              <div className="detail-row"><span className="detail-label">付费理由</span><span className="detail-value">{r.minimumProductCard.paymentReason}</span></div>
              <div className="detail-row"><span className="detail-label">首批潜在用户</span><span className="detail-value">{r.minimumProductCard.firstCustomers}</span></div>
            </div>
            {r.minimumProductCard.alternativePaths.length > 0 && (
              <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-sub)" }}>
                <strong>备选路径：</strong>{r.minimumProductCard.alternativePaths.join("；")}
              </div>
            )}
            <div className="validation-note">
              <strong>【待验证假设】</strong>{r.minimumProductCard.validationNote}
            </div>
          </div>
        </article>

        {/* 24小时行动卡 */}
        <article className="result-card action">
          <header className="rc-header">
            <span className="rc-number">03</span>
            <div>
              <div className="rc-label">第三关 · 走向市场</div>
              <div className="rc-title">24小时行动卡</div>
            </div>
          </header>
          <div className="rc-body">
            {r.actionCard.actions.map((action, i) => (
              <div className="action-item" key={i}>
                <div className="action-num">{i + 1}</div>
                <div className="action-content">
                  <div className="action-task">{action.task}</div>
                  <div className="action-criteria">完成标准：{action.completionCriteria}</div>
                  <div className="action-meta">
                    <span>{action.estimatedMinutes}分钟</span>
                    {action.realUserContact && <span className="real-user-tag">真实用户验证</span>}
                  </div>
                </div>
              </div>
            ))}
            <div className="badge-bar">
              <BadgeSeal size={48} />
              <div className="badge-bar-text">
                <div className="badge-bar-label">已解锁徽章</div>
                <div className="badge-bar-name">{r.actionCard.badge}</div>
              </div>
              <div className="badge-bar-points">{progress.points}分</div>
            </div>
          </div>
        </article>

        {/* 假设 */}
        {r.assumptions.length > 0 && (
          <div className="card" style={{ background: "var(--emerald-light)" }}>
            <div className="me-section-title">待验证假设</div>
            {r.assumptions.map((a, i) => (
              <div key={i} style={{ fontSize: "13px", color: "var(--emerald-deep)", lineHeight: 1.55, marginBottom: "4px" }}>
                · {a}
              </div>
            ))}
          </div>
        )}

        {/* 结尾语 */}
        <div className="closing-quote">{r.closing}</div>

        {/* 操作按钮 */}
        <div className="result-actions">
          <button className="btn btn-primary btn-full" onClick={() => setShowReport(true)}>
            保存我的开局报告
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => setShowReport(true)}>
            分享我的开局成果
          </button>
          <button className="btn btn-ghost btn-full" onClick={editAnswers}>修改答案</button>
          <button className="btn btn-ghost btn-full" onClick={regenerate}>重新生成</button>
          <Link href="/" className="btn btn-ghost btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            返回首页
          </Link>
        </div>
      </main>
      <BottomNav />
      {showReport && (
        <BrandReport
          result={r}
          points={progress.points}
          createdAt={progress.createdAt}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
