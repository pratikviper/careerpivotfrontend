"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as React from "react"

import { cn } from "@/lib/utils"

function Menu({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Root>{children}</DropdownMenu.Root>
}

function MenuTrigger({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
}

function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "center" | "end" }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

function MenuItem({
  children,
  onSelect,
  destructive,
}: {
  children: React.ReactNode
  onSelect?: () => void
  destructive?: boolean
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "cursor-pointer rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-accent",
        destructive && "text-destructive",
      )}
    >
      {children}
    </DropdownMenu.Item>
  )
}

export { Menu, MenuContent, MenuItem, MenuTrigger }
