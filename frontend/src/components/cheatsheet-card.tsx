"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, MoreVertical, Eye, Share2, Trash2, Link2 } from "lucide-react"
import type { File } from "@/api/cheatsheet"
import { Badge } from "@/components/ui/badge"

interface CheatsheetCardProps {
  file: File & { isShared?: boolean; shareUrl?: string }
  onView: (fileId: string) => void
  onShare: (fileId: string, userId: string) => void
  onUnshare: (fileId: string, userId: string) => void
  onDelete: (fileId: string, fileName: string) => void
}

export function CheatsheetCard({ file, onView, onShare, onUnshare, onDelete }: CheatsheetCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const handleCopyShareLink = () => {
    if (file.shareUrl) {
      navigator.clipboard.writeText(file.shareUrl)
    }
  }

  // ไว้มาลั่นทีหลัง
  const handleShare = () => {
    // TODO: Show dialog to select user to share with
    const userId = "target-user-id" // Replace with actual user selection
    onShare(file.id, userId)
  }

  const handleUnshare = () => {
    // TODO: Show dialog to select user to unshare with
    const userId = "target-user-id" // Replace with actual user selection
    onUnshare(file.id, userId)
  }

  const handleDelete = () => {
    const fileName = file.key.split("/").pop() || file.name
    onDelete(file.id, fileName)
  }

  return (
    <Card className="group transition-all duration-200 hover:shadow-md cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{file.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{formatDate(file.createdAt)}</span>
              </div>
              {file.isShared && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  Shared
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(file.id)} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {file.isShared ? (
                <>
                  <DropdownMenuItem onClick={handleCopyShareLink} className="cursor-pointer">
                    <Link2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUnshare} className="cursor-pointer">
                    <Share2 className="h-4 w-4 mr-2" />
                    Unshare
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}