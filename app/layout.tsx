import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { PortfolioProvider } from "@/lib/PortfolioContext";

export const metadata: Metadata = {
  title: "RiskGraph 3.0 — AI Risk Intelligence Platform",
  description: "Graph-theoretic portfolio risk analytics with 4 ML models, adversarial defense, live NSE data, and mathematically auditable predictions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--cream)', display: 'flex', minHeight: '100vh' }}>
        <PortfolioProvider>
          <Sidebar />
          <main className="main-content" style={{
            flex: 1,
            marginLeft: 260,
            overflowY: 'auto',
            padding: '40px 48px',
            minHeight: '100vh',
          }}>
            {children}
          </main>
        </PortfolioProvider>
      </body>
    </html>
  );
}
