import { client } from "./client"

// Schema types matching API
export interface File {
  createdAt: string
  id: string
  key: string
  name: string
  userId: string
}

export type FileType = "slides" | "cheatsheets"

export interface GetAllFilesResponse {
  files: File[]
}

export interface GetPresignedUploadUrlResponse {
  expires_in: string
  key: string
  url: string
}

export interface GetPresignedGetUrlResponse {
  expires_in: string
  url: string
}

export interface GenerateRequest {
  file_ids: string[]
}

export interface GenerateResponse {
  file_id: string
  key: string
}

export interface ShareRequest {
  file_id: string
  user_id: string
}

export interface ShareResponse {
  shared: boolean
}

export interface UnshareRequest {
  file_id: string
  user_id: string
}

export interface UnshareResponse {
  unshared: boolean
}

export interface RemoveFileQuery {
  file: string
  file_type: FileType
}

/**
 * Get all cheatsheet files
 * GET /api/cheatsheet/files
 */
export const getAllFiles = async (): Promise<File[]> => {
  const response = await client.GET("/api/cheatsheet/files", {})
  
  if (response.error) {
    throw new Error("Failed to fetch files")
  }
  
  return (response.data as GetAllFilesResponse)?.files || []
}

/**
 * Delete a cheatsheet file
 * DELETE /api/cheatsheet/files
 */
export const removeFile = async (fileType: FileType, filename: string): Promise<void> => {
  const response = await client.DELETE("/api/cheatsheet/files", {
    params: {
      query: {
        file_type: fileType,
        file: filename,
      },
    },
  })

  if (response.error) {
    throw new Error("Failed to delete file")
  }
}

/**
 * Get presigned URL for uploading a file
 * GET /api/cheatsheet/presigned/upload
 */
export const getPresignedUploadUrl = async (filename: string): Promise<GetPresignedUploadUrlResponse> => {
  const response = await client.GET("/api/cheatsheet/presigned/upload", {
    params: {
      query: {
        filename: filename,
      },
    },
  })

  if (response.error) {
    throw new Error("Failed to get upload URL")
  }

  return response.data as GetPresignedUploadUrlResponse
}

/**
 * Upload file to S3 using presigned URL
 */
export const uploadFileToS3 = async (presignedUrl: string, file: File) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file as unknown as Blob,
  })

  if (!response.ok) {
    throw new Error("Failed to upload file to S3")
  }
}

/**
 * Complete upload process: get presigned URL and upload file
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    // Step 1: Get presigned upload URL
    const uploadData = await getPresignedUploadUrl(file.name)

    // Step 2: Upload file to S3
    await uploadFileToS3(uploadData.url, file)

    // Return the S3 key
    return uploadData.key
  } catch (error) {
    console.error("Error in upload process:", error)
    throw error
  }
}

/**
 * Get presigned URL for viewing/downloading a file
 * GET /api/cheatsheet/presigned
 */
export const getPresignedUrl = async (key: string): Promise<GetPresignedGetUrlResponse> => {
  const response = await client.GET("/api/cheatsheet/presigned", {
    params: {
      query: {
        key: key,
      },
    },
  })

  if (response.error) {
    throw new Error("Failed to get presigned URL")
  }

  return response.data as GetPresignedGetUrlResponse
}

/**
 * Download file from S3
 */
export const downloadFile = async (key: string): Promise<Blob> => {
  try {
    const urlData = await getPresignedUrl(key)

    const response = await fetch(urlData.url, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Failed to download file")
    }

    return await response.blob()
  } catch (error) {
    console.error("Error downloading file:", error)
    throw error
  }
}

/**
 * Share a cheatsheet file with another user
 * POST /api/cheatsheet/share
 */
export const shareFile = async (fileId: string, userId: string): Promise<ShareResponse> => {
  const response = await client.POST("/api/cheatsheet/share", {
    body: {
      file_id: fileId,
      user_id: userId,
    },
  })

  if (response.error) {
    throw new Error("Failed to share file")
  }

  return response.data as ShareResponse
}

/**
 * Unshare a cheatsheet file (revoke access)
 * POST /api/cheatsheet/unshare
 */
export const unshareFile = async (fileId: string, userId: string): Promise<UnshareResponse> => {
  const response = await client.POST("/api/cheatsheet/unshare", {
    body: {
      file_id: fileId,
      user_id: userId,
    },
  })

  if (response.error) {
    throw new Error("Failed to unshare file")
  }

  return response.data as UnshareResponse
}

/**
 * Generate a PDF from files
 * POST /api/cheatsheet/generate
 * Note: This endpoint may take longer to process - show loading UI
 */
export const generateCheatsheet = async (fileIds: string[]) => {
  const response = await client.POST("/api/cheatsheet/generate", {
    body: {
      file_ids: fileIds,
    },
  })

  if (response.error) {
    throw new Error("Failed to generate cheatsheet")
  }

  return response.data as GenerateResponse
}

