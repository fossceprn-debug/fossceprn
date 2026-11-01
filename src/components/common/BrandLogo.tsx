import React from "react";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  className?: string;
  variant?: "navbar" | "footer" | "hero";
  showSubtext?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  variant = "navbar",
  showSubtext = true,
}) => {
  return (
    <Link
      to="/"
      className={`group flex items-center gap-3 transition-opacity hover:opacity-95 ${className}`}
      aria-label="FOSS CEPrn Home"
    >
      {/* Official FOSS Logo Icon */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-white border border-border/80 shadow-xs p-1">
        <img
          src="/foss-logo.svg"
          alt="FOSS Logo"
          className="h-9 w-auto max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-black tracking-tight text-foss-black font-sans leading-none">
            FOSS <span className="text-foss-green">CEPrn</span>
          </span>
        </div>
        {showSubtext && (
          <span className="text-[10px] font-semibold tracking-wider text-foss-gray uppercase mt-0.5 leading-none">
            FOSS UNITED · STUDENTS CHAPTER
          </span>
        )}
      </div>
    </Link>
  );
};
