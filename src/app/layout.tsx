import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GUGU | 인플루언서 공동구매", template: "%s | GUGU" },
  description: "인플루언서가 큐레이션한 뷰티 공동구매 플랫폼",
  keywords: ["공동구매", "뷰티", "인플루언서", "할인", "공구"],
  openGraph: {
    title: "GUGU | 인플루언서 공동구매",
    description: "인플루언서가 큐레이션한 뷰티 공동구매 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen" style={{ background: '#FAFAFA' }}>
        {children}
      </body>
    </html>
  );
}
