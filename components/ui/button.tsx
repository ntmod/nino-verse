import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border-3 border-transparent text-sm font-bold uppercase tracking-[2px] whitespace-nowrap transition-all outline-none select-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#000000] text-[#ffffff] border-[#000000] hover:bg-[#ffffff] hover:text-[#000000]",
        outline: "border-[#000000] bg-[#ffffff] text-[#000000] hover:bg-[#000000] hover:text-[#ffffff]",
        secondary: "bg-[#ffffff] text-[#000000] border-[#000000] hover:bg-[#000000] hover:text-[#ffffff]",
        ghost: "bg-transparent text-[#000000] hover:text-[#0000ff] underline border-none active:scale-95 p-0 normal-case tracking-normal",
        destructive: "bg-[#FF0000] text-[#ffffff] border-[#000000] hover:bg-[#000000] hover:text-[#FF0000]",
        link: "text-[#0000ff] underline normal-case tracking-normal border-none p-0 bg-transparent",
        
        /* Apple Design System Button Variants (Mapped to Brutalist variants to remain compatible with v2 copy/pasted pages) */
        "apple-primary": "bg-[#000000] text-[#ffffff] border-[#000000] hover:bg-[#ffffff] hover:text-[#000000]",
        "apple-secondary": "bg-[#ffffff] text-[#000000] border-[#000000] hover:bg-[#000000] hover:text-[#ffffff]",
        "apple-dark-utility": "bg-[#000000] text-[#ffffff] border-[#000000] hover:bg-[#ffffff] hover:text-[#000000]",
        "apple-pearl": "bg-[#ffffff] text-[#000000] border-[#000000] hover:bg-[#000000] hover:text-[#ffffff]",
      },
      size: {
        default: "h-11 gap-2 px-6 py-2.5",
        xs: "h-8 gap-1.5 px-3 text-[11px]",
        sm: "h-9 gap-1.5 px-4 text-xs",
        lg: "h-14 gap-2.5 px-8 py-3 text-base",
        icon: "size-10 border-3 border-[#000000] bg-[#ffffff] text-[#000000] hover:bg-[#000000] hover:text-[#ffffff] p-0 flex items-center justify-center",
        "icon-xs": "size-7 border-3 border-[#000000]",
        "icon-sm": "size-8 border-3 border-[#000000]",
        "icon-lg": "size-12 border-3 border-[#000000]",
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
