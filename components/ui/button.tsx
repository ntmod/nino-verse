import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-bold uppercase tracking-[2px] whitespace-nowrap transition-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight-ink select-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-highlight text-highlight-foreground border-highlight-ink hover:bg-highlight-hover",
        outline: "border-foreground bg-card text-foreground hover:bg-foreground hover:text-card",
        secondary: "bg-card text-foreground border-foreground hover:bg-foreground hover:text-card",
        ghost: "bg-transparent text-foreground hover:text-highlight-ink underline border-none active:scale-95 p-0 normal-case tracking-normal",
        destructive: "bg-destructive text-card border-foreground hover:bg-foreground hover:text-destructive",
        link: "text-highlight-ink underline normal-case tracking-normal border-none p-0 bg-transparent",
        
        /* Soft card design variants */
        "apple-primary": "bg-foreground text-card border-foreground hover:bg-card hover:text-foreground",
        "apple-secondary": "bg-card text-foreground border-foreground hover:bg-foreground hover:text-card",
        "apple-dark-utility": "bg-foreground text-card border-foreground hover:bg-card hover:text-foreground",
        "apple-pearl": "bg-card text-foreground border-foreground hover:bg-foreground hover:text-card",
      },
      size: {
        default: "h-11 gap-2 px-6 py-2.5",
        xs: "h-8 gap-1.5 px-3 text-[11px]",
        sm: "h-9 gap-1.5 px-4 text-xs",
        lg: "h-14 gap-2.5 px-8 py-3 text-base",
        icon: "size-10 border border-foreground bg-card text-foreground hover:bg-foreground hover:text-card p-0 flex items-center justify-center",
        "icon-xs": "size-7 border border-foreground",
        "icon-sm": "size-8 border border-foreground",
        "icon-lg": "size-12 border border-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
