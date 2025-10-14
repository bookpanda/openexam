import { client } from "./client"

export interface UserProfile {
  id: string
  email: string
  name: string
}

export const getGoogleLoginUrl = async () => {
  const response = await client.GET("/api/user/google", {})
  console.log(response.data)
  return response.data
}
