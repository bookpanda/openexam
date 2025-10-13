"use client"

import { LoginForm } from "@/components/login-form"
import Shuffle from "@/components/Shuffle"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-[100svh] flex-col items-center justify-center gap-10 p-6 md:p-10">

      <h1 className="text-4xl font-extrabold text-center">
        <Shuffle
          text="Open Exam"
          shuffleDirection="right"
          duration={1.5}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          threshold={0.1}
          triggerOnce={true}
          triggerOnHover={true}
          respectReducedMotion={true}
          loop={true}
          loopDelay={2}
        />
      </h1>

      <div className="flex w-full max-w-sm flex-col rounded-2xl">
        <LoginForm />
      </div>
    </div>
  )
}
