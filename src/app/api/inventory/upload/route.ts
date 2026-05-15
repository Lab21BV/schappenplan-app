import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const keys: string[] = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (!file.type.startsWith("image/")) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await uploadToS3(buffer, file.name, file.type);
    keys.push(key);
  }

  return NextResponse.json({ keys });
}
