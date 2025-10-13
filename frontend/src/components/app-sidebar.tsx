"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import {
  PenSquare,
  Search,
  LogOut,
  FileText,
  Presentation,
  ChevronRight,
  User,
  Copy,
  Check,
  BookOpen,
} from "lucide-react"
import { getAllFiles, type File } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "./sidebar-provider"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/lib/services/user-service"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AppSidebarProps {
  user: UserProfile
  onUploadClick?: () => void
}

function SidebarContent({ user, onNavigate, onUploadClick }: AppSidebarProps & { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const [showCheatsheets, setShowCheatsheets] = useState(true)
  const [showSlides, setShowSlides] = useState(true)
  const [copied, setCopied] = useState(false)
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const [showHowToGenerate, setShowHowToGenerate] = useState(false)

  useEffect(() => {
    loadFiles()

    const handleFileChange = () => {
      loadFiles()
    }

    window.addEventListener("filesChanged", handleFileChange)
    const interval = setInterval(() => loadFiles(), 10000)

    return () => {
      window.removeEventListener("filesChanged", handleFileChange)
      clearInterval(interval)
    }
  }, [])

  const loadFiles = async () => {
    try {
      const fetched = await getAllFiles()
      fetched.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      setFiles(fetched)
    } catch (error) {
      console.error("Error loading files:", error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const navigate = (path: string) => {
    router.push(path)
    onNavigate?.()
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setUserPopoverOpen(false)
    await logout()
  }

  const handleUploadClick = () => {
    onUploadClick?.()
    onNavigate?.()
  }

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy user ID:", error)
    }
  }

  const handleHowToGenerate = () => {
    setUserPopoverOpen(false)
    setShowHowToGenerate(true)
  }

  const truncateFileName = (text: string, maxLength = 24) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
  }

  const slides = files.filter((f) => f.key.startsWith("slides/"))
  const cheatsheets = files.filter((f) => f.key.startsWith("cheatsheets/"))

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground overflow-hidden">
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed ? (
          <span className="font-semibold tracking-tight text-lg">OpenExam</span>
        ) : (
          <div className="flex justify-center w-full">
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
          onClick={handleUploadClick}
          title="Upload Slides"
        >
          <PenSquare className="h-5 w-5" />
          {!isCollapsed && <span>Upload Slides</span>}
        </Button>

        <Button
          variant="ghost"
          className={cn("w-full hover:bg-sidebar-accent", isCollapsed ? "justify-center px-2" : "justify-start gap-3")}
          onClick={() => navigate("/")}
          title="My Files"
        >
          <Search className="h-5 w-5" />
          {!isCollapsed && <span>My Files</span>}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-y-auto mt-2">
          <ScrollArea className="flex-1 px-2">
            {isLoadingFiles ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="pb-3">
                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent text-sm font-medium"
                    onClick={() => setShowSlides(!showSlides)}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${showSlides ? "rotate-90" : ""}`} />
                    <Presentation className="h-4 w-4 text-blue-500" />
                    <span>Slides</span>
                  </Button>
                  {showSlides && (
                    <div className="ml-6 mt-1 space-y-1">
                      {slides.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-1">No slides</p>
                      ) : (
                        slides.map((file) => (
                          <Button
                            key={file.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-2 text-sm h-auto py-2 px-3 rounded-md hover:bg-sidebar-accent",
                              pathname === `/cheatsheets/${file.id}` && "bg-sidebar-accent",
                            )}
                            onClick={() => navigate(`/cheatsheets/${file.id}`)}
                          >
                            <span className="truncate text-left flex-1">{truncateFileName(file.name)}</span>
                          </Button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent text-sm font-medium"
                    onClick={() => setShowCheatsheets(!showCheatsheets)}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${showCheatsheets ? "rotate-90" : ""}`} />
                    <FileText className="h-4 w-4 text-green-500" />
                    <span>Cheatsheets</span>
                  </Button>
                  {showCheatsheets && (
                    <div className="ml-6 mt-1 space-y-1">
                      {cheatsheets.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-1">No cheatsheets</p>
                      ) : (
                        cheatsheets.map((file) => (
                          <Button
                            key={file.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-2 text-sm h-auto py-2 px-3 rounded-md hover:bg-sidebar-accent",
                              pathname === `/cheatsheets/${file.id}` && "bg-sidebar-accent",
                            )}
                            onClick={() => navigate(`/cheatsheets/${file.id}`)}
                          >
                            <span className="truncate text-left flex-1">{truncateFileName(file.name)}</span>
                          </Button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      <div className="p-2 border-t border-sidebar-border">
        {!isCollapsed ? (
          <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-sidebar-accent h-auto py-3 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full">{user.name}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-popover" align="end" side="top" sideOffset={8}>
              <div className="flex flex-col">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>

                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User ID</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-accent"
                      onClick={handleCopyUserId}
                      title="Copy User ID"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="text-xs font-mono text-muted-foreground break-all">{user.id}</code>
                </div>

                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 py-2.5 h-auto rounded-none hover:bg-accent"
                    onClick={handleHowToGenerate}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">How to generate</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-2.5 h-auto rounded-none hover:bg-accent"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">{isLoggingOut ? "Logging out..." : "Log out"}</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-center px-2 hover:bg-sidebar-accent h-12">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-popover" align="end" side="right" sideOffset={8}>
              <div className="flex flex-col">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>

                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User ID</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-accent"
                      onClick={handleCopyUserId}
                      title="Copy User ID"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="text-xs font-mono text-muted-foreground break-all">{user.id}</code>
                </div>

                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 py-2.5 h-auto rounded-none hover:bg-accent"
                    onClick={handleHowToGenerate}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">How to generate</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-2.5 h-auto rounded-none hover:bg-accent"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">{isLoggingOut ? "Logging out..." : "Log out"}</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Dialog open={showHowToGenerate} onOpenChange={setShowHowToGenerate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              How to Generate Cheatsheets
            </DialogTitle>
            <DialogDescription>Follow these simple steps to create your cheatsheet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Upload Slides</h4>
                <p className="text-sm text-muted-foreground">
                  Click the "Upload Slides" button and select your slide files
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Select Slides</h4>
                <p className="text-sm text-muted-foreground">Choose the slides you want to convert into a cheatsheet</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Click Generate and Wait</h4>
                <p className="text-sm text-muted-foreground">
                  Press the "Generate" button and wait for the process to complete
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Cheatsheet Ready</h4>
                <p className="text-sm text-muted-foreground">
                  Your cheatsheet file will appear in the My Files when ready
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AppSidebar({ user, onUploadClick }: AppSidebarProps) {
  const { isOpen, isCollapsed, setIsOpen } = useSidebar()

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-64 max-w-64 md:hidden">
          <VisuallyHidden>
            <SheetTitle>Sidebar Menu</SheetTitle>
            <SheetDescription>Navigation and user options</SheetDescription>
          </VisuallyHidden>
          <SidebarContent user={user} onNavigate={() => setIsOpen(false)} onUploadClick={onUploadClick} />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen border-r border-sidebar-border transition-all duration-300 overflow-hidden",
          isCollapsed ? "w-16 max-w-16" : "w-64 max-w-64",
        )}
      >
        <SidebarContent user={user} onUploadClick={onUploadClick} />
      </aside>
    </>
  )
}
