"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { CheatsheetCard } from "@/components/cheatsheet-card"
import { getAllFiles, shareFile, unshareFile, removeFile, type File } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const data = await getAllFiles()
      setFiles(data)
    } catch (error) {
      console.error("Error loading files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = async (fileId: string) => {
    router.push(`/cheatsheets/${fileId}`)
  }

  const handleShare = async (fileId: string, userId: string) => {
    try {
      await shareFile(fileId, userId)
      await loadFiles()
    } catch (error) {
      console.error("Error sharing file:", error)
    }
  }

  const handleUnshare = async (fileId: string, userId: string) => {
    try {
      await unshareFile(fileId, userId)
      await loadFiles()
    } catch (error) {
      console.error("Error unsharing file:", error)
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      const fileType = fileName.includes("cheatsheet") ? "cheatsheets" : "slides"
      await removeFile(fileType, fileName)
      setFiles((prev) => prev.filter((file) => file.id !== fileId))
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} />

      <main
        className={cn(
          "flex-1 transition-all duration-300",
          "md:ml-64",
          isCollapsed && "md:ml-16",
        )}
      >
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarToggle />
              <h1 className="text-lg font-semibold">My Cheatsheets</h1>
            </div>
            <Button onClick={() => router.push("/upload")} className="bg-primary hover:bg-primary/90 flex items-center justify-center sm:justify-start gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Cheatsheet</span>
            </Button>
          </div>
        </header>

        <div className="px-6 py-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-lg bg-card animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="rounded-full bg-white/5 p-4 mb-4">
                <Plus className="h-8 w-8 text-white/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No cheatsheets yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Upload a PDF to generate your first AI-powered cheatsheet
              </p>
              <Button onClick={() => router.push("/upload")} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Cheatsheet
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file, index) => (
                <div key={file.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CheatsheetCard
                    file={file}
                    onView={handleView}
                    onShare={handleShare}
                    onUnshare={handleUnshare}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}