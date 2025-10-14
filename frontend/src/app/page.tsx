"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus, FileCheck, Presentation, Loader2, Search, X, RefreshCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { CheatsheetCard } from "@/components/cheatsheet-card"
import { getAllFiles, generateCheatsheet, removeFile, type File } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { UploadModal } from "@/components/upload-modal"
import { Input } from "@/components/ui/input"

// Debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}

function groupFilesByDate(files: File[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Start of current week (Sunday)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const groups = {
    today: [] as File[],
    thisWeek: [] as File[],
    thisMonth: [] as File[],
    older: [] as File[],
  }

  files.forEach((file) => {
    const fileDate = new Date(file.createdAt)
    if (fileDate >= today) {
      groups.today.push(file)
    } else if (fileDate >= startOfWeek) {
      groups.thisWeek.push(file)
    } else if (fileDate >= startOfMonth) {
      groups.thisMonth.push(file)
    } else {
      groups.older.push(file)
    }
  })

  return groups
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const { toast } = useToast()

  const [files, setFiles] = useState<File[]>([])
  // Track recently deleted keys to prevent re-adding them from server responses
  const deletedKeysRef = useRef<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlides, setSelectedSlides] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "slides" | "cheatsheets">("all")
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [deleteFile, setDeleteFile] = useState<{ id: string; key: string; name: string } | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadFiles = useCallback(async () => {
    console.log("Dashboard: loadFiles called")
    setIsLoading(true)
    try {
      const data = await getAllFiles()
      data.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      // Preserve optimistic uploads and filter out files recently deleted locally
      setFiles((prev) => {
        try {
          // remove stale deleted keys older than 30s
          const now = Date.now()
          for (const [k, ts] of deletedKeysRef.current.entries()) {
            if (now - ts > 30_000) deletedKeysRef.current.delete(k)
          }
          const placeholders = prev.filter((f) => typeof f.id === "string" && f.id.startsWith("upload-"))
          const serverFiltered = data.filter((d) => {
            const deletedAt = deletedKeysRef.current.get(d.key)
            // If key was deleted within last 10s, exclude it from server results
            if (deletedAt && Date.now() - deletedAt < 10_000) return false
            return true
          })
          const serverKeys = new Set(serverFiltered.map((d) => d.key))
          const remainingPlaceholders = placeholders.filter((p) => !serverKeys.has(p.key))
          return [...remainingPlaceholders, ...serverFiltered]
        } catch (err) {
          console.error("Error while updating files:", err)
          return data
        }
      })
      console.log("Dashboard: Files loaded successfully, count:", data.length)
    } catch (error) {
      console.error("Error loading files:", error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const debouncedLoadFiles = useMemo(() => debounce(loadFiles, 100), [loadFiles])

  useEffect(() => {
    loadFiles()

    type FilesChangedDetail = { action?: string; files?: Array<{ key?: string; name?: string } | string> }
    type UploadedFile = { name: string; key: string }

    const handleFileChange = (e: Event) => {
      // If it's a CustomEvent with detail, try to update optimistically
      const custom = e as CustomEvent | Event
      const detail = ((custom as CustomEvent).detail ?? {}) as FilesChangedDetail
      if (detail) {
        if (detail.action === "uploaded" && Array.isArray(detail.files)) {
          console.log("Dashboard: Optimistically adding uploaded files", detail.files)
          // Create placeholder entries for uploaded files so UI updates immediately.
          setFiles((prev) => {
            const placeholders = (detail.files as Array<string | UploadedFile>).map((f) => ({
              id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: typeof f === "string" ? f : f.name,
              key: typeof f === "string" ? f : f.key,
              userId: user?.id || "",
              createdAt: new Date().toISOString(),
            })) as File[]
            return [...placeholders, ...prev]
          })
          // Also trigger a background refresh to reconcile real data
          debouncedLoadFiles()
          return
        }
        if (detail.action === "deleted" && Array.isArray(detail.files)) {
          const filesArr = detail.files as Array<string>
          console.log("Dashboard: Optimistically removing deleted files", filesArr)
          setFiles((prev) => prev.filter((f) => !filesArr.includes(f.key) && !filesArr.includes(f.id)))
          debouncedLoadFiles()
          return
        }
      }

      // fallback: call debounced load
      console.log("  Dashboard: Received filesChanged event, calling debouncedLoadFiles")
      debouncedLoadFiles()
    }

    window.addEventListener("filesChanged", handleFileChange)

    return () => {
      window.removeEventListener("filesChanged", handleFileChange)
      debouncedLoadFiles.cancel()
    }
  }, [loadFiles, debouncedLoadFiles, user])

  const handleView = async (fileId: string) => {
    router.push(`/cheatsheets/${fileId}`)
  }

  // const handleShare = async (fileId: string, userId: string) => {
  //   try {
  //     await shareFile(fileId, userId)
  //     window.dispatchEvent(new CustomEvent("filesChanged", { detail: { action: "shared", files: [fileId] } }))
  //     await loadFiles()
  //   } catch (error) {
  //     console.error("Error sharing file:", error)
  //   }
  // }

  // const handleUnshare = async (fileId: string, userId: string) => {
  //   try {
  //     await unshareFile(fileId, userId)
  //     window.dispatchEvent(new CustomEvent("filesChanged", { detail: { action: "unshared", files: [fileId] } }))
  //     await loadFiles()
  //   } catch (error) {
  //     console.error("Error unsharing file:", error)
  //   }
  // }

  const handleDeleteClick = (fileId: string, fileKey: string) => {
    const file = files.find((f) => f.id === fileId)
    if (file) {
      setDeleteFile({ id: fileId, key: fileKey, name: file.name })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteFile) return

    const fileToDelete = deleteFile
    setDeleteFile(null)

    setFiles((prev) => prev.filter((file) => file.id !== fileToDelete.id))

    try {
      const fileType = fileToDelete.key.startsWith("slides/") ? "slides" : "cheatsheets"
      const filename = fileToDelete.key.split("/").pop() || fileToDelete.key

      // Mark key as deleted (with timestamp) so background reconciles don't re-add it
      deletedKeysRef.current.set(fileToDelete.key, Date.now())

      await removeFile(fileType, filename)

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      // Notify listeners with details so they can update immediately
      window.dispatchEvent(new CustomEvent("filesChanged", { detail: { action: "deleted", files: [fileToDelete.key] } }))
      loadFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })

      loadFiles()
    }
  }

  const handleToggleSlide = (fileId: string) => {
    setSelectedSlides((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const handleGenerateCheatsheets = async () => {
  if (selectedSlides.size === 0) {
    toast({
      title: "No slides selected",
      description: "Please select at least one slide to generate cheatsheets",
      variant: "destructive",
    })
    return
  }

  setIsGenerating(true)
  setShowGenerateModal(true)

  try {
    const slidesArray = Array.from(selectedSlides)

    const newFile = await generateCheatsheet(slidesArray)

    setFiles(prev => [
      {
        id: newFile.file_id,
        key: newFile.key,
        name: `Cheatsheet ${Date.now()}`,
        userId: user?.id || "",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])

    toast({
      title: "Success",
      description: `Generated 1 cheatsheet from ${slidesArray.length} slide${slidesArray.length > 1 ? "s" : ""}.`,
    })

    setSelectedSlides(new Set())

    setTimeout(() => loadFiles(), 300)

  } catch (error) {
    console.error(error)
    toast({
      title: "Generation Failed",
      description: "Failed to generate cheatsheets. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsGenerating(false)
    setTimeout(() => setShowGenerateModal(false), 1000)
  }
}


  // receive uploaded files from UploadModal; add optimistic placeholders and refresh
  const handleUploadComplete = (uploaded?: { key: string; name: string }[]) => {
    if (uploaded && uploaded.length > 0) {
      setFiles((prev) => {
        const placeholders = uploaded.map((f) => ({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          key: f.key,
          userId: user?.id || "",
          createdAt: new Date().toISOString(),
        })) as File[]
        return [...placeholders, ...prev]
      })

      // reconcile with server data in background
      debouncedLoadFiles()
      return
    }

    // fallback: just refresh
    loadFiles()
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadFiles()
      toast({
        title: "Refreshed",
        description: "Files list has been updated",
      })
    } catch (error) {
      console.error("Error refreshing files:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const slides = files.filter((f) => f.key.startsWith("slides/"))
  const cheatsheets = files.filter((f) => f.key.startsWith("cheatsheets/"))
  const filteredFiles = (activeTab === "all" ? files : activeTab === "slides" ? slides : cheatsheets).filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const groupedFiles = groupFilesByDate(filteredFiles)

  if (!user) return null

  const deleteFileType = deleteFile?.key.startsWith("slides/") ? "slide" : "cheatsheet"

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} onUploadClick={() => setShowUploadModal(true)} />

      <main className={cn("flex-1 transition-all duration-300", "md:ml-64", isCollapsed && "md:ml-16")}>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="px-3 sm:px-4 md:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <SidebarToggle />
              <h1 className={cn("text-base sm:text-lg font-semibold truncate", showSearch && "hidden sm:block")}>
                My Files
              </h1>
              {showSearch && (
                <div className="flex-1 max-w-md animate-in fade-in slide-in-from-right-5 duration-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9 h-9"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {selectedSlides.size > 0 && (
                <Button
                  onClick={handleGenerateCheatsheets}
                  disabled={isGenerating}
                  className="hidden md:flex bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9"
                  size="sm"
                >
                  <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Generate ({selectedSlides.size})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9 p-0"
                title="Refresh files"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSearch(!showSearch)
                  if (showSearch) {
                    setSearchQuery("")
                  }
                }}
                className="h-9 w-9 p-0"
              >
                {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-9"
                size="sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Upload Slide</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="px-3 sm:px-4 md:px-6 py-6 sm:py-8">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
              size="sm"
              className="whitespace-nowrap"
            >
              All ({files.length})
            </Button>
            <Button
              variant={activeTab === "slides" ? "default" : "outline"}
              onClick={() => setActiveTab("slides")}
              size="sm"
              className="whitespace-nowrap"
            >
              <Presentation className="h-4 w-4 mr-2" />
              Slides ({slides.length})
            </Button>
            <Button
              variant={activeTab === "cheatsheets" ? "default" : "outline"}
              onClick={() => setActiveTab("cheatsheets")}
              size="sm"
              className="whitespace-nowrap"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Cheatsheets ({cheatsheets.length})
            </Button>
          </div>

          {searchQuery && (
            <div className="mb-4 text-sm text-muted-foreground">
              Found {filteredFiles.length} result{filteredFiles.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 sm:h-72 rounded-lg bg-card animate-pulse" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 animate-fade-in">
              <div className="rounded-full bg-white/5 p-4 mb-4">
                {searchQuery ? (
                  <Search className="h-8 w-8 text-white/50" />
                ) : activeTab === "cheatsheets" ? (
                  <FileCheck className="h-8 w-8 text-white/50" />
                ) : (
                  <Plus className="h-8 w-8 text-white/50" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                {searchQuery ? "No results found" : activeTab === "cheatsheets" ? "No cheatsheets" : "No files yet"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm">
                {searchQuery
                  ? `No files match &quot;${searchQuery}&quot;. Try a different search term.`
                  : activeTab === "cheatsheets"
                    ? "Generate cheatsheets by selecting slides and clicking the generate button"
                    : "Upload a slide PDF to get started"}
              </p>
              {!searchQuery && activeTab !== "cheatsheets" && (
                <Button onClick={() => setShowUploadModal(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Slide
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {groupedFiles.today.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Today</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedFiles.today.map((file, index) => {
                      const isSlide = file.key.startsWith("slides/")
                      const isSelected = selectedSlides.has(file.id)

                      return (
                        <div key={file.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="relative">
                            {isSlide && (
                              <div className="absolute top-3 left-3 z-10">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleSlide(file.id)}
                                  className="scale-125 bg-background border-2"
                                />
                              </div>
                            )}
                            <CheatsheetCard
                              file={file}
                              onView={handleView}
                              onDelete={handleDeleteClick}
                              fileType={isSlide ? "slide" : "cheatsheet"}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {groupedFiles.thisWeek.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-foreground">This Week</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedFiles.thisWeek.map((file, index) => {
                      const isSlide = file.key.startsWith("slides/")
                      const isSelected = selectedSlides.has(file.id)

                      return (
                        <div key={file.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="relative">
                            {isSlide && (
                              <div className="absolute top-3 left-3 z-10">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleSlide(file.id)}
                                  className="scale-125 bg-background border-2"
                                />
                              </div>
                            )}
                            <CheatsheetCard
                              file={file}
                              onView={handleView}
                              onDelete={handleDeleteClick}
                              fileType={isSlide ? "slide" : "cheatsheet"}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {groupedFiles.thisMonth.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-foreground">This Month</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedFiles.thisMonth.map((file, index) => {
                      const isSlide = file.key.startsWith("slides/")
                      const isSelected = selectedSlides.has(file.id)

                      return (
                        <div key={file.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="relative">
                            {isSlide && (
                              <div className="absolute top-3 left-3 z-10">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleSlide(file.id)}
                                  className="scale-125 bg-background border-2"
                                />
                              </div>
                            )}
                            <CheatsheetCard
                              file={file}
                              onView={handleView}
                              onDelete={handleDeleteClick}
                              fileType={isSlide ? "slide" : "cheatsheet"}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {groupedFiles.older.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Older</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedFiles.older.map((file, index) => {
                      const isSlide = file.key.startsWith("slides/")
                      const isSelected = selectedSlides.has(file.id)

                      return (
                        <div key={file.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="relative">
                            {isSlide && (
                              <div className="absolute top-3 left-3 z-10">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleSlide(file.id)}
                                  className="scale-125 bg-background border-2"
                                />
                              </div>
                            )}
                            <CheatsheetCard
                              file={file}
                              onView={handleView}
                              onDelete={handleDeleteClick}
                              fileType={isSlide ? "slide" : "cheatsheet"}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedSlides.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden">
            <Button
              onClick={handleGenerateCheatsheets}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 shadow-lg h-12 px-6 text-base"
              size="lg"
            >
              <FileCheck className="h-5 w-5 mr-2" />
              Generate ({selectedSlides.size})
            </Button>
          </div>
        )}
      </main>

      <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} onUploadComplete={handleUploadComplete} />

      <Dialog open={showGenerateModal} onOpenChange={(open) => !isGenerating && setShowGenerateModal(open)}>
        <DialogContent className="max-w-sm mx-4" onInteractOutside={(e) => isGenerating && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Generating Cheatsheets</DialogTitle>
            <DialogDescription>
              {selectedSlides.size} slide(s) are being processed. This may take a while.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Please wait...</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteFileType}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteFile?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}