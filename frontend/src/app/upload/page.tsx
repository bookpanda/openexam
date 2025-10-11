"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { UploadZone } from "@/components/upload-zone"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

export default function UploadPage() {
  const router = useRouter()
  const { isCollapsed } = useSidebar()

  const { user } = useAuth()

  const handleUploadComplete = () => {
    router.push("/dashboard")
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} />

      <main className={cn("flex-1 transition-all duration-300", "md:ml-64", isCollapsed && "md:ml-16")}>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarToggle />
              <h1 className="text-lg font-semibold">Upload PDF</h1>
            </div>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </header>

        <div className="px-4 md:px-6 py-8">
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Upload your PDF</h2>
              <p className="text-muted-foreground mt-2">Upload a PDF to generate a cheatsheet</p>
            </div>
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
        </div>
      </main>
    </div>
  )
}
