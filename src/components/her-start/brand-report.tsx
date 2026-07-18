"use client";

import { useEffect, useRef, useState } from "react";
import type { HerStartAnalysis } from "@/lib/her-start/schema";
import { getDisplayName } from "@/lib/her-start/use-progress";

type BrandReportProps = {
  result: HerStartAnalysis;
  points: number;
  createdAt: string | null;
  displayName?: string;
  showNameInReport?: boolean;
  isDemo?: boolean;
  onClose: () => void;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://her-start.codebanana.app";

export function BrandReport({ result, points, createdAt, displayName, showNameInReport = true, isDemo = false, onClose }: BrandReportProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const displayLabel = showNameInReport ? getDisplayName(displayName) : "我";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("html-to-image");
        if (!mounted || !reportRef.current) return;
        const dataUrl = await mod.toPng(reportRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: "#FAF8F3",
          width: 375,
        });
        if (mounted) {
          setImageUrl(dataUrl);
          setStatus("ready");
        }
      } catch {
        if (mounted) setStatus("error");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

  async function handleShare() {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], "her-start-report.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${displayLabel}的人生资产开局报告`,
          text: `我用她来开局，看见了被自己低估的人生资产。`,
          files: [file],
        });
        return;
      }
    } catch { /* 用户取消 */ }
    alert("请长按上方图片保存，然后分享给朋友。");
  }

  async function handleDownload() {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "her-start-report.png";
    link.click();
  }

  async function handleCopyLink() {
    const text = `${SITE_URL}\n我用她来开局，看见了被自己低估的人生资产。`;
    try {
      await navigator.clipboard.writeText(text);
      alert("链接已复制到剪贴板");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("链接已复制到剪贴板");
    }
  }

  return (
    <div className="report-modal" onClick={onClose}>
      <div className="report-modal-inner" onClick={(e) => e.stopPropagation()}>
        {status === "loading" && (
          <div className="report-loading">
            <div className="loading-ring" />
            <p>正在生成品牌长图……</p>
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--text-sub)", marginBottom: "20px" }}>
              长图生成失败，可能是手机内存不足。可以尝试使用精简分享。
            </p>
            <div className="report-actions">
              <button className="btn btn-secondary btn-full" onClick={() => setStatus("loading")}>
                重新生成
              </button>
              <button className="btn btn-ghost btn-full" onClick={handleCopyLink}>
                复制产品链接
              </button>
            </div>
          </div>
        )}

        {status === "ready" && imageUrl && (
          <>
            <div className="report-image-area">
              <img src={imageUrl} alt={`${displayLabel}的人生资产开局报告`} />
              <p style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "10px", lineHeight: 1.5 }}>
                微信用户请长按图片保存到手机
              </p>
            </div>
            <div className="report-actions">
              <button className="btn btn-primary btn-full" onClick={handleDownload}>保存图片</button>
              <button className="btn btn-secondary btn-full" onClick={handleShare}>分享</button>
              <button className="btn btn-ghost btn-full" onClick={handleCopyLink}>复制链接</button>
            </div>
          </>
        )}

        {/* 隐藏的报告 DOM，用于生成图片 */}
        <div style={{ position: "absolute", left: "-9999px", top: 0, width: "375px" }}>
          <div ref={reportRef}>
            <div className="report-brand">
              <div className="report-brand-title">她来开局</div>
              <div className="report-brand-sub">HER START</div>
              <div className="report-brand-ai">Value Mirror · 价值镜</div>
              <div className="report-brand-h1">{displayLabel}的人生资产开局报告</div>
              <div style={{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}>
                女性人生资产发现与商业化AI陪练
              </div>
            </div>

            <div className="report-body">
              {isDemo && (
                <div style={{
                  padding: "10px 14px", marginBottom: "16px",
                  background: "#FEF0EE", borderRadius: "10px",
                  fontSize: "12px", color: "#8B2D26", lineHeight: 1.55,
                }}>
                  <strong>当前为演示结果</strong>，以下内容不是根据你本次回答生成的个性化分析。
                </div>
              )}

              <div className="report-section">
                <div className="report-section-title">价值定位</div>
                <p>{result.lifeAssetCard.valuePositioning}</p>
              </div>

              <div className="report-section">
                <div className="report-section-title">3项核心人生资产</div>
                {result.lifeAssetCard.assets.map((a, i) => (
                  <div key={i} style={{ marginBottom: "8px", fontSize: "13px", lineHeight: 1.6 }}>
                    <strong>{i + 1}. {a.name}</strong><br />
                    <span style={{ color: "var(--text-sub)" }}>来源：{a.source}</span><br />
                    <span style={{ color: "var(--text-sub)" }}>能力：{a.formedAbility}</span>
                  </div>
                ))}
              </div>

              <div className="report-section">
                <div className="report-section-title">核心可迁移能力</div>
                <p>{result.lifeAssetCard.coreTransferableAbility}</p>
              </div>

              <div className="report-section">
                <div className="report-section-title">第一个最小产品</div>
                <p><strong>{result.minimumProductCard.productName}</strong></p>
                <p style={{ marginTop: "4px" }}>
                  <span style={{ color: "var(--text-sub)" }}>目标用户：</span>{result.minimumProductCard.targetUser}<br />
                  <span style={{ color: "var(--text-sub)" }}>解决问题：</span>{result.minimumProductCard.problem}<br />
                  <span style={{ color: "var(--text-sub)" }}>交付方式：</span>{result.minimumProductCard.delivery}<br />
                  <span style={{ color: "var(--text-sub)" }}>建议测试价格：</span><span style={{ color: "var(--gold)", fontWeight: 600 }}>{result.minimumProductCard.testPrice}</span><br />
                  <span style={{ color: "var(--text-sub)" }}>首批潜在用户：</span>{result.minimumProductCard.firstCustomers}
                </p>
              </div>

              <div className="report-section">
                <div className="report-section-title">未来24小时行动</div>
                {result.actionCard.actions.map((a, i) => (
                  <div key={i} style={{ marginBottom: "6px", fontSize: "13px", lineHeight: 1.6 }}>
                    {i + 1}. {a.task}（{a.estimatedMinutes}分钟）
                    {a.realUserContact ? " · 接触真实用户" : ""}
                  </div>
                ))}
                <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>
                  「{result.actionCard.badge}」徽章 · {points}经验值
                </div>
              </div>

              <div className="report-section" style={{ fontSize: "12px", color: "var(--text-sub)" }}>
                报告日期：{dateStr}
              </div>

              <div style={{
                marginTop: "16px", padding: "10px 14px",
                background: "var(--gold-soft)", borderRadius: "10px",
                fontSize: "12px", color: "#5C4A1F", lineHeight: 1.55,
              }}>
                商业价值待验证声明：本报告{isDemo ? "为演示示例" : "由AI生成"}，其中商业价值与价格均为待验证假设，不构成收入承诺。真实答案需通过潜在用户验证。
              </div>
            </div>

            <div className="report-footer">
              <p>你不是缺少价值，而是还没有把自己的人生资产重新组织成别人愿意购买的价值。今天，我们完成了第一步。</p>
              <p className="sign">由「她来开局 · Value Mirror」生成<br />{SITE_URL}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
