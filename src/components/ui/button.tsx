import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-foss-green text-white hover:bg-foss-greenHover shadow-sm hover:shadow-glow-green",
        secondary:
          "bg-foss-lightBg text-foss-black hover:bg-emerald-50 hover:text-foss-greenDark border border-border",
        outline:
          "border border-border bg-white hover:bg-foss-lightBg hover:border-foss-green hover:text-foss-green text-foss-black",
        ghost:
          "hover:bg-foss-lightBg hover:text-foss-green text-foss-black",
        dark:
          "bg-foss-black text-white hover:bg-gray-800 shadow-sm",
        link:
          "text-foss-green underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-7 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
