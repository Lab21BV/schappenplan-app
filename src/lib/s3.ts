import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION ?? "nl-01",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME!;
  const ext = fileName.split(".").pop() ?? "bin";
  const key = `inventory/${randomUUID()}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    })
  );

  return key;
}

export async function getS3ImageUrl(key: string): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME!;
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

export function getS3PublicUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET_NAME!;
  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteFromS3ByKey(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME!;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
  await Promise.all(keys.map((s) => deleteFromS3ByKey(extractKeyFromUrl(s)).catch(() => {})));
}

export function extractKeyFromUrl(url: string): string | null {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET_NAME!;
  const prefix = `${endpoint}/${bucket}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return url;
}
