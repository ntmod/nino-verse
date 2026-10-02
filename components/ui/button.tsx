import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent text-sm font-bold uppercase tracking-[2px] whitespace-nowrap transition-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97423] select-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#e9a342] text-[#372b1c] border-[#b97423] hover:bg-[#f0b35a]",
        outline: "border-[#292722] bg-[#fffdf5] text-[#292722] hover:bg-[#292722] hover:text-[#fffdf5]",
        secondary: "bg-[#fffdf5] text-[#292722] border-[#292722] hover:bg-[#292722] hover:text-[#fffdf5]",
        ghost: "bg-transparent text-[#292722] hover:text-[#b97423] underline border-none active:scale-95 p-0 normal-case tracking-normal",
        destructive: "bg-[#b0523b] text-[#fffdf5] border-[#292722] hover:bg-[#292722] hover:text-[#b0523b]",
        link: "text-[#b97423] underline normal-case tracking-normal border-none p-0 bg-transparent",
        
        /* Soft card design variants */
        "apple-primary": "bg-[#292722] text-[#fffdf5] border-[#292722] hover:bg-[#fffdf5] hover:text-[#292722]",
        "apple-secondary": "bg-[#fffdf5] text-[#292722] border-[#292722] hover:bg-[#292722] hover:text-[#fffdf5]",
        "apple-dark-utility": "bg-[#292722] text-[#fffdf5] border-[#292722] hover:bg-[#fffdf5] hover:text-[#292722]",
        "apple-pearl": "bg-[#fffdf5] text-[#292722] border-[#292722] hover:bg-[#292722] hover:text-[#fffdf5]",
      },
      size: {
        default: "h-11 gap-2 px-6 py-2.5",
        xs: "h-8 gap-1.5 px-3 text-[11px]",
        sm: "h-9 gap-1.5 px-4 text-xs",
        lg: "h-14 gap-2.5 px-8 py-3 text-base",
        icon: "size-10 border border-[#292722] bg-[#fffdf5] text-[#292722] hover:bg-[#292722] hover:text-[#fffdf5] p-0 flex items-center justify-center",
        "icon-xs": "size-7 border border-[#292722]",
        "icon-sm": "size-8 border border-[#292722]",
        "icon-lg": "size-12 border border-[#292722]",
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
