"use client"

import { LoginForm } from "@/components/login-form"
import Shuffle from "@/components/Shuffle"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-[100svh] flex-col items-center justify-center gap-10 p-6 md:p-10">
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">
          OPEN EXAM
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Sigma students do not study — We generate.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col rounded-2xl">
        <LoginForm />
      </div>
    </div>
  )
}
