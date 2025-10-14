"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
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
import { Share2, UserPlus, Trash2, AlertCircle } from "lucide-react"

interface SharedUser {
  userId: string
  name?: string
  sharedAt?: string
}

interface ShareDialogProps {
  fileId: string
  fileName: string
  sharedUsers: SharedUser[]
  currentUserId: string
  onShare: (userId: string) => Promise<void>
  onUnshare: (userId: string) => Promise<void>
}

export function ShareDialog({
  fileName,
  sharedUsers,
  currentUserId,
  onShare,
  onUnshare
}: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [userIdInput, setUserIdInput] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [isUnsharing, setIsUnsharing] = useState(false)
  const [error, setError] = useState("")
  const [localSharedUsers, setLocalSharedUsers] = useState<SharedUser[]>(sharedUsers)
  const [unshareConfirm, setUnshareConfirm] = useState<string | null>(null)

  useEffect(() => {
    setLocalSharedUsers(sharedUsers)
  }, [sharedUsers])

  useEffect(() => {
    // ตรวจสอบว่ามี user ที่ไม่มีชื่อหรือไม่ (แสดงว่า user ไม่มีจริง)
    const invalidUsers = localSharedUsers.filter(u => !u.name && u.userId !== currentUserId)
    if (invalidUsers.length > 0) {
      // ลบ user ที่ไม่มีชื่อออกจาก local state
      setLocalSharedUsers(prev => prev.filter(u => u.name || u.userId === currentUserId))
      
      // แสดง error
      invalidUsers.forEach(invalidUser => {
        setError(`User ID ${invalidUser.userId} does not exist`)
      })
    }
  }, [localSharedUsers, currentUserId])

  const handleShare = async () => {
    const targetUserId = userIdInput.trim()
    
    // Validation: ต้องเป็นตัวเลขเท่านั้น
    if (!targetUserId) {
      setError("Please enter a User ID")
      return
    }
    
    if (!/^\d+$/.test(targetUserId)) {
      setError("User ID must contain only numbers")
      return
    }
    
    if (targetUserId === currentUserId) {
      setError("You cannot share a file with yourself")
      return
    }
    
    if (localSharedUsers.some(u => u.userId === targetUserId)) {
      setError("This file is already shared with this user")
      return
    }

    setIsSharing(true)
    setError("")

    try {
      await onShare(targetUserId)
      setUserIdInput("")
      // รอ parent component update ผ่าน props
      // ถ้า user ไม่มีชื่อ useEffect ด้านบนจะจัดการให้
    } catch (error) {
      console.error("Error sharing file:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to share file"
      
      // ตรวจสอบว่าเป็น error ที่บอกว่า user ไม่มีจริง
      if (errorMessage.includes("not found") || errorMessage.includes("does not exist") || errorMessage.includes("User not found")) {
        setError(`User ID ${targetUserId} does not exist`)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleUnshareClick = (targetUserId: string) => {
    setUnshareConfirm(targetUserId)
  }

  const handleUnshareConfirm = async () => {
    if (!unshareConfirm) return
    
    const targetId = unshareConfirm
    setIsUnsharing(true)
    
    try {
      // ปิด dialog ก่อน
      setUnshareConfirm(null)
      
      await onUnshare(targetId)
      
      // ลบออกจาก local state
      setLocalSharedUsers(prev => prev.filter(u => u.userId !== targetId))
    } catch (err) {
      console.error("Error unsharing file:", err)
      setError(err instanceof Error ? err.message : "Failed to unshare file")
    } finally {
      setIsUnsharing(false)
    }
  }

  const handleUnshareCancel = () => {
    setUnshareConfirm(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // อนุญาตเฉพาะตัวเลข
    if (value === "" || /^\d+$/.test(value)) {
      setUserIdInput(value)
      setError("")
    }
  }

  const otherSharedUsers = localSharedUsers.filter(u => u.userId !== currentUserId)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Manage Sharing
        {otherSharedUsers.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {otherSharedUsers.length}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share &quot;{fileName}&quot;</DialogTitle>
            <DialogDescription>
              Enter the User ID (numbers only) of the person you want to share this file with
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter User ID (numbers only)"
                value={userIdInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSharing) {
                    handleShare()
                  }
                }}
                disabled={isSharing}
                className="flex-1"
                type="text"
                inputMode="numeric"
              />
              <Button
                onClick={handleShare}
                disabled={isSharing || !userIdInput.trim()}
                size="icon"
              >
                {isSharing ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {otherSharedUsers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Shared with:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {otherSharedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-medium truncate">
                          {user.name || `User ${user.userId}`}
                        </p>
                        {user.sharedAt && (
                          <p className="text-xs text-muted-foreground">
                            Shared {new Date(user.sharedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnshareClick(user.userId)}
                        disabled={isUnsharing}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {otherSharedUsers.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/20">
                <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>This file hasn&apos;t been shared with anyone yet</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!unshareConfirm && !isUnsharing} onOpenChange={(open) => {
        if (!open && !isUnsharing) {
          handleUnshareCancel()
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access from{" "}
              <strong>
                {localSharedUsers.find(u => u.userId === unshareConfirm)?.name || `User ${unshareConfirm}`}
              </strong>
              ? They will no longer be able to view this file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleUnshareCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnshareConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}