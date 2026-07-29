import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailSend",
  description: "購入者への個別メールをシンプルに管理するローカルMVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
