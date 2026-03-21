import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "RiskGraph 2.0 — Quantitative Risk Analytics",
  description: "Graph-theoretic portfolio risk analytics with Monte Carlo simulation, stress testing, and Indian tax computation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--cream)', display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main className="main-content" style={{
          flex: 1,
          marginLeft: 220,
          overflowY: 'auto',
          padding: '40px 48px',
          minHeight: '100vh',
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
