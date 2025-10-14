"use client"

import { Button } from "@/components/ui/button"
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react"
import { useSidebar } from "./sidebar-provider"

export function SidebarToggle() {
  const { isCollapsed, toggle } = useSidebar()

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="hover:bg-accent">
      <Menu className="h-5 w-5 md:hidden" />
      {isCollapsed ? (
        <PanelLeft className="h-5 w-5 hidden md:block" />
      ) : (
        <PanelLeftClose className="h-5 w-5 hidden md:block" />
      )}
    </Button>
  )
}
