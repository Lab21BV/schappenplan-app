import { NextResponse } from "next/server";
import { getS3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return new NextResponse("Missing path", { status: 400 });
  try {
    const bucket = process.env.S3_BUCKET_NAME!;
    const client = getS3Client();
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: path }));
    const stream = response.Body as any;
    if (stream) {
      const bytes = await stream.transformToByteArray();
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": response.ContentType || "image/jpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
    return new NextResponse("Not found", { status: 404 });
  } catch {
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
