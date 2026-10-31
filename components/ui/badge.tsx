import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-transparent bg-primary text-primary-foreground",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      outline: "border-border text-foreground",
      success: "border-transparent bg-accent text-accent-foreground",
      warning: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
      danger: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100",
    },
  },
  defaultVariants: { variant: "secondary" },
})

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
