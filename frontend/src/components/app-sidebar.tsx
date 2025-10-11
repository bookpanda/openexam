"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PenSquare, Search, LogOut, ChevronDown, FileText, ChevronRight, Settings } from "lucide-react"
import { getAllFiles, type File } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "./sidebar-provider"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/lib/services/user-service"

interface AppSidebarProps {
  user: UserProfile
}

function SidebarContent({ user, onNavigate }: AppSidebarProps & { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [cheatsheets, setCheatsheets] = useState<File[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const [showCheatsheets, setShowCheatsheets] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadCheatsheets()
  }, [])

  const loadCheatsheets = async () => {
    setIsLoadingFiles(true)
    try {
      const files = await getAllFiles()
      setCheatsheets(files)
    } catch (error) {
      console.error("Error loading cheatsheets:", error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  const navigate = (path: string) => {
    router.push(path)
    onNavigate?.()
  }

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-3 border-b border-sidebar-border">
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <span className="font-semibold">OpenExam</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OE</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 space-y-1">
        <Button
          variant="ghost"
          className={cn("w-full hover:bg-sidebar-accent", isCollapsed ? "justify-center px-2" : "justify-start gap-3")}
          onClick={() => navigate("/upload")}
          title="New Cheatsheet"
        >
          <PenSquare className="h-5 w-5" />
          {!isCollapsed && <span>New Cheatsheet</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn("w-full hover:bg-sidebar-accent", isCollapsed ? "justify-center px-2" : "justify-start gap-3")}
          onClick={() => navigate("/dashboard")}
          title="My Cheatsheets"
        >
          <Search className="h-5 w-5" />
          {!isCollapsed && <span>My Cheatsheets</span>}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <Button
            variant="ghost"
            className="mx-2 mt-4 mb-2 justify-start gap-2 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground text-sm"
            onClick={() => setShowCheatsheets(!showCheatsheets)}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${showCheatsheets ? "rotate-90" : ""}`} />
            <span>Cheatsheets</span>
          </Button>

          {showCheatsheets && (
            <ScrollArea className="flex-1 px-2">
              {isLoadingFiles ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded bg-muted animate-pulse" />
                  ))}
                </div>
              ) : cheatsheets.length === 0 ? (
                <div className="py-4 px-3 text-center text-muted-foreground text-sm">No cheatsheets yet</div>
              ) : (
                <div className="space-y-1 pb-2">
                  {cheatsheets.map((file) => (
                    <Button
                      key={file.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 hover:bg-sidebar-accent text-sm h-auto py-2 px-3",
                        pathname === `/cheatsheets/${file.id}` && "bg-sidebar-accent",
                      )}
                      onClick={() => navigate(`/cheatsheets/${file.id}`)}
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-left">{file.name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}

      <div className="p-2 border-t border-sidebar-border space-y-2">
        {!isCollapsed ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={user.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-center px-2 hover:bg-sidebar-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt={user.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { isOpen, isCollapsed, setIsOpen } = useSidebar()

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-64 md:hidden">
          <SidebarContent user={user} onNavigate={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent user={user} />
      </aside>
    </>
  )
}