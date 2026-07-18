import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "她来开局｜女性人生资产发现与商业化 AI 陪练",
  description: "看见你走过的路，做成你的第一个产品。用约3分钟，重新发现被你低估的人生资产，并获得第一份最小产品和24小时市场行动。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "她来开局 Her Start",
    description: "女性人生资产发现与商业化 AI 陪练",
    images: ["/og-image.svg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B5B45",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
