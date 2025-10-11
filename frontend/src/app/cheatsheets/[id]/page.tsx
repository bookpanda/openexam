"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, Download, Trash2, Link2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { useRouter, useParams } from "next/navigation"
import { getAllFiles, shareFile, unshareFile, removeFile, downloadFile, type File } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { CheatsheetPreview } from "@/components/cheatsheet-preview-wrapper"

export default function CheatsheetViewPage() {
  const router = useRouter()
  const params = useParams()
  const fileId = params.id as string
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()

  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShared, setIsShared] = useState(false)

  useEffect(() => {
    loadFile()
  }, [fileId])

  const loadFile = async () => {
    setIsLoading(true)
    try {
      const files = await getAllFiles()
      const foundFile = files.find((f) => f.id === fileId)
      setFile(foundFile || null)
    } catch (error) {
      console.error("Error loading file:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!file) return
    try {
      // TODO: Need to get target userId from somewhere
      const targetUserId = "user-id-to-share-with"
      await shareFile(fileId, targetUserId)
      setIsShared(true)
    } catch (error) {
      console.error("Error sharing file:", error)
    }
  }

  const handleUnshare = async () => {
    if (!file) return
    try {
      // TODO: Need to get target userId from somewhere
      const targetUserId = "user-id-to-unshare-with"
      await unshareFile(fileId, targetUserId)
      setIsShared(false)
    } catch (error) {
      console.error("Error unsharing file:", error)
    }
  }

  const handleDelete = async () => {
    if (!file) return
    try {
      const fileType = file.key.startsWith("cheatsheets/") ? "cheatsheets" : "slides"
      const fileName = file.key.split("/").pop() || file.name
      await removeFile(fileType, fileName)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleDownload = async () => {
    if (!file) return
    try {
      const blob = await downloadFile(file.key)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/${fileId}`
    navigator.clipboard.writeText(shareUrl)
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cheatsheet...</p>
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cheatsheet not found</h2>
          <p className="text-muted-foreground mb-6">The cheatsheet you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} />

      <main className={cn("flex-1 transition-all duration-300", "md:ml-64", isCollapsed && "md:ml-16")}>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <SidebarToggle />
              <h1 className="text-lg font-semibold truncate">{file.name}</h1>
            </div>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </header>

        <div className="px-4 md:px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{file.name}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(file.createdAt))}
                    </span>
                  </div>
                  {isShared && (
                    <Badge variant="secondary" className="mt-3 bg-primary/10 text-primary border-primary/20">
                      <Link2 className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {isShared ? (
                    <>
                      <Button variant="outline" onClick={handleCopyShareLink}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button variant="outline" onClick={handleUnshare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Unshare
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Cheatsheet Preview</h3>
              <CheatsheetPreview fileKey={file.key} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}