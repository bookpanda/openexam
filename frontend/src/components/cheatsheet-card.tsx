"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Presentation, FileCheck, Download } from "lucide-react"
import type { File } from "@/api/cheatsheet"
import { useAuth } from "@/components/auth-provider"
import { downloadFile } from "@/api/cheatsheet"
import { useToast } from "@/hooks/use-toast"

interface CheatsheetCardProps {
  file: File
  onView: (fileId: string) => void
  onDelete: (fileId: string, fileKey: string) => void
  fileType?: "slide" | "cheatsheet"
}

export function CheatsheetCard({ file, onView, onDelete, fileType }: CheatsheetCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const isSlide = fileType === "slide" || file.key.startsWith("slides/")
  const isOwner = file.userId === user?.id

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
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

  return (
    <div
      className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden
                 hover:shadow-lg hover:border-primary/50 transition-all duration-300
                 w-full max-w-full"
    >
      <div
        className={`relative h-28 sm:h-36 md:h-44 flex items-center justify-center
                     ${
                      isSlide
                        ? "bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent"
                        : "bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent"
                    }`}
      >
        <div
          className={`p-3 sm:p-4 rounded-xl
             ${isSlide ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"}`}
        >
          {isSlide ? (
            <Presentation className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
          ) : (
            <FileCheck className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
          )}
        </div>

        {!isOwner && (
          <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
            Shared
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5 min-h-[110px] sm:min-h-[120px]">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 flex-1" title={file.name}>
            {file.name}
          </h3>
          <Badge
            variant="secondary"
            className={`shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 ${
              isSlide
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : "bg-green-500/10 text-green-600 border-green-500/20"
            }`}
          >
            {isSlide ? "Slide" : "Cheatsheet"}
          </Badge>
        </div>

        <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mb-3">
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(file.createdAt))}
        </p>

        <div className="mt-auto flex gap-2">
          <Button
            onClick={() => onView(file.id)}
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-9"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
            <span className="hidden xs:inline sm:inline">View</span>
            <span className="xs:hidden sm:hidden">View</span>
          </Button>
          
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className="w-9 sm:w-10 h-8 sm:h-9 p-0 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            title="Download"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          
          {isOwner && (
            <Button
              onClick={() => onDelete(file.id, file.key)}
              size="sm"
              variant="outline"
              className="w-9 sm:w-10 h-8 sm:h-9 p-0 bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}