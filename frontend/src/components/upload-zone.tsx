"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X } from "lucide-react"
import { uploadFile, generateCheatsheet } from "@/api/cheatsheet"

interface UploadZoneProps {
  onUploadComplete: () => void
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find((file) => file.type === "application/pdf")

    if (pdfFile) {
      setSelectedFile(pdfFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload file to S3
      setUploadProgress(10)
      const key = await uploadFile(selectedFile)
      setUploadProgress(50)

      // Step 2: Extract file ID from key
      // Key format: slides/{userId}/{fileId}_{filename}.pdf
      const keyParts = key.split("/")
      const fileNameWithId = keyParts[keyParts.length - 1]
      const fileId = fileNameWithId.split("_")[0]

      setUploadProgress(60)
      setIsUploading(false)
      setIsGenerating(true)

      // Step 3: Generate cheatsheet
      // Note: This endpoint may take a while
      await generateCheatsheet([fileId])
      setUploadProgress(100)

      setTimeout(() => {
        setSelectedFile(null)
        setIsGenerating(false)
        setUploadProgress(0)
        onUploadComplete()
      }, 500)
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      setIsGenerating(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  const isProcessing = isUploading || isGenerating

  return (
    <div className="bg-card border border-border rounded-xl p-8">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent"}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className={`rounded-full bg-muted p-4 transition-transform duration-200 ${isDragging ? "scale-110" : ""}`}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Upload PDF Document</p>
              <p className="text-sm text-muted-foreground mt-1">Drag and drop your PDF here, or click to browse</p>
            </div>
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                <span>Browse Files</span>
              </Button>
              <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border border-border">
            <div className="rounded-lg bg-primary/10 p-3 flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            {!isProcessing && (
              <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isUploading && "Uploading to S3..."}
                  {isGenerating && "Generating cheatsheet..."}
                </span>
                <span className="font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {isGenerating && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  This may take a while. Please wait...
                </p>
              )}
            </div>
          )}

          <Button onClick={handleUpload} disabled={isProcessing} className="w-full">
            {isProcessing ? "Processing..." : "Generate Cheatsheet"}
          </Button>
        </div>
      )}
    </div>
  )
}