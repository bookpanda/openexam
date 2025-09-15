"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { client } from "@/api/client"

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    const handleLogin = async () => {
      if (code && state) {
        try {
          const response = await client.POST("/api/user/google/callback", {
            body: { code, state },
          })
          console.log("Login response:", response)
          localStorage.setItem("accessToken", response.data?.token || "")

          router.replace("/")
        } catch (err) {
          console.error("Login failed", err)
          router.replace("/")
        }
      }
    }

    handleLogin()
  }, [searchParams, router])

  return <div>Logging in...</div>
}
