import { client } from "./client"

export const getGoogleLoginUrl = async () => {
  const response = await client.GET("/api/user/google", {})
  console.log(response.data)
  return response.data
}
