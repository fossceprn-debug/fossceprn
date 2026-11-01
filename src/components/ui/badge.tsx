import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-foss-green text-white shadow-sm",
        secondary:
          "border-transparent bg-foss-lightBg text-foss-black",
        accent:
          "border-foss-green/20 bg-foss-greenLight text-foss-greenDark font-medium",
        outline: "border-border text-foss-black",
        statusOpen:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        statusClosed:
          "border-gray-200 bg-gray-100 text-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
