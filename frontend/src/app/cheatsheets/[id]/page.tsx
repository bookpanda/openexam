"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Trash2, Link2, Presentation, FileCheck } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { useRouter, useParams } from "next/navigation"
import { getFileById, shareFile, unshareFile, removeFile, downloadFile, type File, type Share } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { CheatsheetPreview } from "@/components/cheatsheet-preview-wrapper"
import { ShareDialog } from "@/components/share-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Extended Share type with sharedAt
interface SharedUserWithDate extends Share {
  sharedAt?: string
}

export default function CheatsheetViewPage() {
  const router = useRouter()
  const params = useParams()
  const fileId = params.id as string
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sharedUsers, setSharedUsers] = useState<SharedUserWithDate[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadFile()

    const handleFileChange = () => {
      console.log("File change detected, reloading file details...")
      loadFile()
    }

    window.addEventListener("filesChanged", handleFileChange)

    return () => {
      window.removeEventListener("filesChanged", handleFileChange)
    }
  }, [fileId])

  const loadFile = async () => {
    setIsLoading(true)
    try {
      const data = await getFileById(fileId)

      setFile(data.file)
      setSharedUsers(
        data.shares.map((s) => ({
          userId: s.userId,
          name: s.name,
          sharedAt: new Date().toISOString(),
        })),
      )
    } catch (error) {
      console.error("Error loading file:", error)
      toast({
        title: "Error",
        description: "Failed to load file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async (targetUserId: string) => {
    if (!file) return

    try {
      await shareFile(fileId, targetUserId)
      await loadFile()

      // Notify other components
      window.dispatchEvent(new Event("filesChanged"))

      toast({ title: "Success", description: `File shared successfully` })
    } catch (error) {
      console.error("Error sharing file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share file",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleUnshare = async (targetUserId: string) => {
    if (!file) return

    try {
      await unshareFile(fileId, targetUserId)
      await loadFile()

      // Notify other components
      window.dispatchEvent(new Event("filesChanged"))

      toast({ title: "Success", description: `Access revoked successfully` })
    } catch (error) {
      console.error("Error unsharing file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unshare file",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!file) return

    setShowDeleteDialog(false) // Close dialog immediately

    try {
      const fileType = file.key.startsWith("slides/") ? "slides" : "cheatsheets"
      const filename = file.key.split("/").pop() || file.key
      await removeFile(fileType, filename)

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      // Notify sidebar immediately
      window.dispatchEvent(new Event("filesChanged"))

      // Navigate immediately
      router.push("/")
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async () => {
    if (!file) return

    try {
      await downloadFile(file.key)
      toast({
        title: "Success",
        description: "Download started",
      })
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  const isSlide = file?.key.startsWith("slides/")
  const fileType = isSlide ? "Slide" : "Cheatsheet"
  const fileTypeName = isSlide ? "slide" : "cheatsheet"
  const isOwner = file?.userId === user.id

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {fileType.toLowerCase()}...</p>
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">File not found</h2>
          <p className="text-muted-foreground mb-6">The file you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Files
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
          <div className="px-3 sm:px-4 md:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <SidebarToggle />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {isSlide ? (
                  <Presentation className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                )}
                <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">{file.name}</h1>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </header>

        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                    <h2 className="text-lg sm:text-xl font-semibold break-words">{file.name}</h2>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        isSlide
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-green-500/10 text-green-500 border-green-500/20",
                      )}
                    >
                      {fileType}
                    </Badge>
                    {!isOwner && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20"
                      >
                        Shared with you
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="break-words">
                      {new Intl.DateTimeFormat("en-US", {
                        timeZone: "Asia/Bangkok",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(file.createdAt))}
                    </span>
                  </div>
                  {isOwner && sharedUsers.filter((u) => u.userId !== user.id).length > 0 && (
                    <Badge
                      variant="secondary"
                      className="mt-2 sm:mt-3 text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Shared with {sharedUsers.filter((u) => u.userId !== user.id).length}{" "}
                      {sharedUsers.filter((u) => u.userId !== user.id).length === 1 ? "person" : "people"}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  {isOwner && (
                    <>
                      <div className="w-full sm:w-auto">
                        <ShareDialog
                          fileId={fileId}
                          fileName={file.name}
                          sharedUsers={sharedUsers}
                          currentUserId={user.id}
                          onShare={handleShare}
                          onUnshare={handleUnshare}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteClick}
                        className="w-full sm:w-auto bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{fileType} Preview</h3>
              <CheatsheetPreview fileKey={file.key} />
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {fileTypeName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {fileTypeName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
