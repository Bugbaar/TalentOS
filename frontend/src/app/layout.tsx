"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en">
      <body className="min-h-screen bg-sf text-tx selection:bg-sr-indigo-100 selection:text-sr-indigo-900 font-sans">
        <div className="flex min-h-screen">
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Navbar onMenu={() => setMenuOpen(true)} />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
