"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { client } from "@/api/client"
import { userService } from "@/lib/services/user-service"

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  useEffect(() => {
    const handleLogin = async () => {
      if (!code || !state) {
        console.error("Missing code or state")
        setStatus("error")
        router.replace("/signin?error=missing_params")
        return
      }

      try {
        setStatus("loading")
        
        const response = await client.POST("/api/user/google/callback", {
          body: { code, state },
        })
        
        console.log("Login response:", response)

        const userData = response.data
        
        if (!userData || !userData.token) {
          throw new Error("Invalid response from server")
        }

        localStorage.setItem("accessToken", userData.token)
        userService.saveUserProfile({
          id: userData.id,
          email: userData.email,
          name: userData.name,
        })

        setStatus("success")
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        window.location.href = "/"
        
      } catch (err) {
        console.error("Login failed:", err)
        setStatus("error")
        
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user_profile")
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        router.replace("/signin?error=login_failed")
      }
    }

    handleLogin()
  }, [code, state, router])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Logging In...</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <p className="text-gray-600">Login Successfull</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <p className="text-gray-600">Error...</p>
          </>
        )}
      </div>
    </div>
  )
}
