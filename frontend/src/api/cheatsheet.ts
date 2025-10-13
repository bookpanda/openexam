import { client } from "./client"
import { components } from "./schema" // สมมติว่ามี schema export

// ใช้ types จาก schema
export type File = components["schemas"]["File"]
export type FileType = components["schemas"]["FileType"]
export type GenerateRequest = components["schemas"]["GenerateRequest"]
export type GenerateResponse = components["schemas"]["GenerateResponse"]
export type ShareRequest = components["schemas"]["ShareRequest"]
export type ShareResponse = components["schemas"]["ShareResponse"]
export type UnshareRequest = components["schemas"]["UnshareRequest"]
export type UnshareResponse = components["schemas"]["UnshareResponse"]
export type GetAllFilesResponse = components["schemas"]["GetAllFilesResponse"]
export type GetPresignedUploadUrlResponse = components["schemas"]["GetPresignedUploadUrlResponse"]
export type GetPresignedGetUrlResponse = components["schemas"]["GetPresignedGetUrlResponse"]
export type GetFileResponse = components["schemas"]["GetFileResponse"]
export type Share = components["schemas"]["Share"]

// Extended types สำหรับใช้งานใน frontend (ถ้าต้องการ shared info)
export interface FileWithShares extends File {
  sharedWith?: Share[]
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
  
  return response.data?.files || []
}

/**
 * Get a single file by ID with share information
 * GET /api/cheatsheet/files/:file_id
 */
export const getFileById = async (fileId: string): Promise<GetFileResponse> => {
  // Build the full path with the file_id
  const path = `/api/cheatsheet/files/${fileId}` as any
  
  const response = await client.GET(path, {})

  if (response.error) {
    throw new Error(response.error.message || "Failed to fetch file details")
  }

  return response.data as GetFileResponse
}

/**
 * Delete a cheatsheet file
 * DELETE /api/cheatsheet/files
 * @param fileType - "slides" or "cheatsheets"
 * @param filename - just the filename with random prefix, e.g. "9e25d9_cheatsheet.pdf"
 */
export const removeFile = async (fileType: FileType, filename: string): Promise<void> => {
  console.log("Deleting file:", { fileType, filename })

  const response = await client.DELETE("/api/cheatsheet/files", {
    params: {
      query: { file_type: fileType, file: filename },
    },
  })

  if (response.error) {
    console.error("Delete API error:", response.error)
    throw new Error(response.error.message || "Failed to delete file")
  }
}


/**
 * Get presigned URL for uploading a file
 * GET /api/cheatsheet/presigned/upload
 * Returns a presigned URL to upload directly to S3
 * The key will be in format: slides/{userId}/{randomPrefix_filename.pdf}
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
 * PUT request with PDF file as binary in body
 */
export const uploadFileToS3 = async (presignedUrl: string, file: globalThis.File) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      'Content-Type': 'application/pdf', // ระบุเป็น PDF
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file to S3: ${response.statusText}`)
  }
}

/**
 * Complete upload process: get presigned URL and upload file
 * Returns the S3 key in format: slides/{userId}/{randomPrefix_filename.pdf}
 */
export const uploadFile = async (file: globalThis.File): Promise<string> => {
  try {
    // Step 1: Get presigned upload URL from backend
    const uploadData = await getPresignedUploadUrl(file.name)
    console.log("Upload URL received, key:", uploadData.key)
    
    // Step 2: Upload file directly to S3 using presigned URL
    await uploadFileToS3(uploadData.url, file)
    console.log("File uploaded successfully to S3")
    
    return uploadData.key
  } catch (error) {
    console.error("Error in upload process:", error)
    throw error
  }
}

/**
 * Get presigned URL for viewing/downloading a file
 * GET /api/cheatsheet/presigned
 * @param key - Full S3 key e.g. "slides/1/4e8d92_test.pdf" or "cheatsheets/1/9e25d9_cheatsheet.pdf"
 */
export const getPresignedUrl = async (key: string): Promise<GetPresignedGetUrlResponse> => {
  // Ensure the key is properly formatted (should already be the full S3 path)
  // Format: slides/{userId}/{randomPrefix_filename.pdf}
  // Example: slides/1/4e8d92_test.pdf
  console.log("Getting presigned URL for key:", key)
  
  const response = await client.GET("/api/cheatsheet/presigned", {
    params: {
      query: {
        key: key,
      },
    },
  })

  if (response.error) {
    console.error("Presigned URL error:", response.error)
    throw new Error(response.error.message || "Failed to get presigned URL")
  }

  if (!response.data?.url) {
    throw new Error("No URL returned from server")
  }

  console.log("Presigned URL received, expires in:", response.data.expires_in)
  return response.data as GetPresignedGetUrlResponse
}

/**
 * Download file from S3
 * Gets presigned URL from backend, then fetches file from S3 directly
 */
export const downloadFile = async (key: string): Promise<void> => {
  try {
    console.log("Starting download for key:", key)
    
    // Step 1: Get presigned download URL from backend
    const data = await getPresignedUrl(key)

    if (!data?.url) {
      throw new Error("Failed to get presigned URL")
    }

    console.log("Downloading from S3...")
    
    // Step 2: Download file from S3 using presigned URL
    const fileResponse = await fetch(data.url)
    if (!fileResponse.ok) {
      throw new Error(`File download failed: ${fileResponse.statusText}`)
    }

    // Step 3: Create download link
    const blob = await fileResponse.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    
    // Extract filename from key (e.g., "slides/1/9e25d9_test.pdf" -> "9e25d9_test.pdf")
    const filename = key.split("/").pop() || "file.pdf"
    a.download = filename
    
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    
    console.log("Download completed:", filename)
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
    throw new Error(response.error.message || "Failed to share file")
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
    throw new Error(response.error.message || "Failed to unshare file")
  }

  return response.data as UnshareResponse
}

/**
 * Generate a PDF from files
 * POST /api/cheatsheet/generate
 */
export const generateCheatsheet = async (fileIds: string[]): Promise<GenerateResponse> => {
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