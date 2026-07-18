import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "她来开局｜女性人生资产发现与商业化 AI 陪练",
  description: "看见你的人生资产，生成第一个最小产品，并在24小时内开始真实市场验证。",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "她来开局 Her Start",
    description: "女性人生资产发现与商业化 AI 陪练",
    images: ["/og-image.svg"],
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
