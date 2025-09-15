"use client"

import { getGoogleLoginUrl } from "@/api/user"

export default function Home() {
  const signIn = async () => {
    const googleLoginUrl = await getGoogleLoginUrl()
    if (!googleLoginUrl) {
      return
    }

    window.location.href = googleLoginUrl
  }
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1>Hello World</h1>

      <button onClick={() => signIn()}>log in</button>
    </div>
  )
}
