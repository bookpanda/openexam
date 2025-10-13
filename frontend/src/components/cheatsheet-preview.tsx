"use client"

import { useState, useEffect } from "react"
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

  useEffect(() => {
    const loadUrl = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { url } = await getPresignedUrl(fileKey)
        setUrl(url)
      } catch (error) {
        console.error("Failed to load PDF preview:", error)
        setError("Failed to load preview. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    loadUrl()
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
