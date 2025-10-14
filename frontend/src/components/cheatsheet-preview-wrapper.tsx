"use client"

import dynamic from "next/dynamic"

export const CheatsheetPreview = dynamic(
  () => import("./cheatsheet-preview"), 
  { ssr: false } 
)