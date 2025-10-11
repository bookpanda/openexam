"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { userService, type UserProfile } from "@/lib/services/user-service"

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// เส้นทางที่ไม่ต้องล็อกอิน
const PUBLIC_ROUTES = ["/signin"]

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initAuth = () => {
      if (typeof window === "undefined") return

      const userProfile = userService.getSavedUserProfile()

      if (!userProfile && !PUBLIC_ROUTES.includes(pathname)) {
        router.replace("/signin")
        setIsLoading(false)
        return
      }

      if (userProfile && (pathname === "/signin" || pathname === "/")) {
        setUser(userProfile)
        router.replace("/dashboard")
        setIsLoading(false)
        return
      }

      setUser(userProfile)
      setIsLoading(false)
    }

    initAuth()
  }, [pathname, router])

  const logout = async () => {
    await userService.logout()
    setUser(null)
    router.push("/signin")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook ใช้ auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// HOC สำหรับป้องกันหน้า protected
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ProtectedRoute(props: P) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}
