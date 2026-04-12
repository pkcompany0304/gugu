import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "GUGU | 인플루언서 공동구매",
    template: "%s | GUGU",
  },
  description:
    "인플루언서가 큐레이션한 뷰티 공동구매 플랫폼. 기간 한정 특가로 함께 구매하세요.",
  keywords: ["공동구매", "뷰티", "인플루언서", "할인", "공구"],
  openGraph: {
    title: "GUGU | 인플루언서 공동구매",
    description: "인플루언서가 큐레이션한 뷰티 공동구매 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
