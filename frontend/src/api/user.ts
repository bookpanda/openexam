import { client } from "./client"

export const getGoogleLoginUrl = async () => {
  const response = await client.GET("/api/user/google", {})
  return response.data
}
