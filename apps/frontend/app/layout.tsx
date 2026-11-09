import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hacksudo EnterpriseOps — IT Workforce, Project Management & VAPT Platform",
  description: "Enterprise IT Workforce Management, Vulnerability Management, and Team Collaboration Platform with Liquid Glass UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        {/* Ambient background light gradients for liquid glass effect */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px]"></div>
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]"></div>
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
