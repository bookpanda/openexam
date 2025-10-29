export interface UserProfile {
  id: string
  email: string
  name: string
  token?: string
}

const saveUserProfile = (profile: UserProfile) => {
  if (!profile) return
  try {
    localStorage.setItem("user_profile", JSON.stringify(profile))
  } catch (err) {
    console.error("saveUserProfile error:", err)
  }
}

const getSavedUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem("user_profile")
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error("getSavedUserProfile error:", err)
    return null
  }
}

const logout = async (): Promise<boolean> => {
  try {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user_profile")
    return true
  } catch (error) {
    console.error("Logout error:", error)
    return false
  }
}

export const userService = {
  saveUserProfile,
  getSavedUserProfile,
  logout,
}
