"use client"

import { useState, useEffect } from "react"
import { getPresignedUrl } from "@/api/cheatsheet"

interface CheatsheetPreviewProps {
  fileKey: string
}

export default function CheatsheetPreview({ fileKey }: CheatsheetPreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUrl = async () => {
      setIsLoading(true)
      try {
        const { url } = await getPresignedUrl(fileKey)
        setUrl(url)
      } catch (error) {
        console.error("Failed to load PDF preview:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUrl()
  }, [fileKey])

  if (isLoading) return <p>Loading preview...</p>
  if (!url) return <p>Cannot load preview</p>

  return (
    <iframe
      src={url}
      className="w-full h-[80vh] rounded-lg border border-border"
      title="Cheatsheet Preview"
    />
  )
}
