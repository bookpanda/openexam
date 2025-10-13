import { NextResponse } from "next/server"
import { client } from "@/api/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 })
  }

  try {
    // Step 1: ขอ presigned URL จาก backend
    const res = await client.GET("/api/cheatsheet/presigned", {
      params: { query: { key } },
    })

    console.log("Presigned URL response:", res)

    if (res.error || !res.data?.url) {
      return NextResponse.json({ error: "Failed to get presigned URL", details: res.error }, { status: 500 })
    }

    // Step 2: ดึงไฟล์จาก S3
    const s3Response = await fetch(res.data.url)

    if (!s3Response.ok) {
      console.error("S3 fetch failed:", s3Response.status, await s3Response.text())
      return NextResponse.json({ error: "Failed to fetch from S3" }, { status: 500 })
    }

    // Step 3: ส่ง blob กลับ
    const arrayBuffer = await s3Response.arrayBuffer()
    const contentType = s3Response.headers.get("Content-Type") || "application/octet-stream"

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${key.split("/").pop()}"`,
      },
    })
  } catch (err: any) {
    console.error("Download error:", err)
    return NextResponse.json({ error: "Download failed", message: err.message }, { status: 500 })
  }
}
