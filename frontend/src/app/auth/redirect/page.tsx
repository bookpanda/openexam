"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { client } from "@/api/client"
import { userService } from "@/lib/services/user-service"

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  useEffect(() => {
    

    const handleLogin = async () => {
      if (code && state) {
        try {
          const response = await client.POST("/api/user/google/callback", {
            body: { code, state },
          })
          console.log("Login response:", response)

          const userData = response.data
          if (userData) {
            localStorage.setItem("accessToken", userData.token || "")

            userService.saveUserProfile({
              id: userData.id,
              email: userData.email,
              name: userData.name,
            })
          }

          router.replace("/")
        } catch (err) {
          console.error("Login failed", err)
          router.replace("/signin")
        }
      }
    }

    handleLogin()
  }, [code, state, router])
  
  return <div>Logging in...</div>
}
