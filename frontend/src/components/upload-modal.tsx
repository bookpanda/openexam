"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadFile } from "@/api/cheatsheet"
import { Progress } from "@/components/ui/progress"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

interface FileWithProgress {
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function UploadModal({ open, onOpenChange, onUploadComplete }: UploadModalProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateAndAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(newFiles).forEach((file) => {
      if (file.type !== "application/pdf") {
        errors.push(`${file.name} is not a PDF file`)
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 50MB limit`)
        return
      }
      validFiles.push(file)
    })

    if (files.length + validFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 10 files at once",
        variant: "destructive",
      })
      return
    }

    if (errors.length > 0) {
      toast({
        title: "Invalid files",
        description: errors.join(", "),
        variant: "destructive",
      })
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [
        ...prev,
        ...validFiles.map((file) => ({
          file,
          progress: 0,
          status: "pending" as const,
        })),
      ])
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      validateAndAddFiles(e.dataTransfer.files)
    },
    [files],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files)
    e.target.value = ""
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadSingleFile = async (fileWithProgress: FileWithProgress, index: number) => {
    try {
      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: "uploading" as const, progress: 10 } : f)))

      // Upload file directly to S3
      await uploadFile(fileWithProgress.file)

      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: "success" as const, progress: 100 } : f)))
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      )
    }
  }

  const handleUploadAll = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      // Upload all files in parallel
      await Promise.all(files.map((file, index) => uploadSingleFile(file, index)))

      const successCount = files.filter((f) => f.status === "success").length
      const errorCount = files.filter((f) => f.status === "error").length

      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${successCount} file(s)`,
        })

        window.dispatchEvent(new Event("filesChanged"))
        onUploadComplete()

        setTimeout(() => {
          onOpenChange(false)
          setFiles([])
        }, 300)
      } else {
        toast({
          title: "Partial success",
          description: `Uploaded ${successCount} file(s), ${errorCount} failed`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) {
      const confirm = window.confirm("Upload in progress. Are you sure you want to close?")
      if (!confirm) return
    }
    onOpenChange(false)
    setFiles([])
  }

  const canUpload = files.length > 0 && files.every((f) => f.status !== "uploading")
  const hasErrors = files.some((f) => f.status === "error")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload PDF Files</DialogTitle>
          <DialogDescription>Upload up to 10 PDF files at once (max 50MB each)</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              ${files.length >= 10 ? "opacity-50 pointer-events-none" : "cursor-pointer"}
            `}
          >
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              disabled={files.length >= 10}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{isDragging ? "Drop files here" : "Drag & drop PDF files"}</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to browse ({files.length}/10 files)</p>
            <Button type="button" variant="outline" disabled={files.length >= 10}>
              Select Files
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Selected Files ({files.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((fileItem, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="flex-shrink-0">
                      {fileItem.status === "pending" && <FileText className="h-5 w-5 text-muted-foreground" />}
                      {fileItem.status === "uploading" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                      {fileItem.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {fileItem.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileItem.status === "uploading" && <Progress value={fileItem.progress} className="h-1 mt-2" />}
                      {fileItem.status === "error" && <p className="text-xs text-destructive mt-1">{fileItem.error}</p>}
                    </div>

                    {fileItem.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="flex-shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {hasErrors && (
              <Button variant="outline" onClick={() => setFiles((prev) => prev.filter((f) => f.status !== "error"))}>
                Remove Failed
              </Button>
            )}
            <Button
              onClick={handleUploadAll}
              disabled={!canUpload || isUploading}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length} {files.length === 1 ? "File" : "Files"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
