"use client"

import { useState, useEffect, useRef } from "react"
import { getPresignedUrl } from "@/api/cheatsheet"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle } from "lucide-react"

interface CheatsheetPreviewProps {
  fileKey: string
}

export default function CheatsheetPreview({ fileKey }: CheatsheetPreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isLoadingRef = useRef(false)
  const currentKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (currentKeyRef.current !== fileKey) {
      setUrl(null)
      setError(null)
      setIsLoading(true)
      currentKeyRef.current = fileKey
    }

    const loadUrl = async () => {
      if (isLoadingRef.current) {
        console.log("Already loading URL, skipping...")
        return
      }

      isLoadingRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        console.log("Loading presigned URL for:", fileKey)
        const data = await getPresignedUrl(fileKey)
        
        if (currentKeyRef.current === fileKey) {
          setUrl(data.url)
          setError(null)
          console.log("URL loaded successfully")
        }
      } catch (err) {
        console.error("Error loading URL:", err)
        if (currentKeyRef.current === fileKey) {
          setError(err instanceof Error ? err.message : "Failed to load preview")
          setUrl(null)
        }
      } finally {
        setIsLoading(false)
        isLoadingRef.current = false
      }
    }

    loadUrl()

    // Cleanup function
    return () => {
      isLoadingRef.current = false
    }
  }, [fileKey])

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] rounded-lg border border-border bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 sm:h-10 sm:w-10" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] rounded-lg border border-border bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
          <p className="text-sm sm:text-base text-muted-foreground">{error || "Cannot load preview"}</p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={url}
      className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] rounded-lg border border-border"
      title="Cheatsheet Preview"
    />
  )
}