import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-foss-black">
      <Navbar />
      <main className={`flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  );
};
