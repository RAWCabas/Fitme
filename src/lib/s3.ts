export const RESUME_BUCKET_NAME = process.env.S3_RESUME_BUCKET || "fitme-resumes";

/**
 * Generates an S3 presigned URL for direct resume upload.
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType = "application/pdf"
): Promise<string> {
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_REGION) {
    // Local / Offline fallback mock URL
    return `https://${RESUME_BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(key)}?mock-presigned=true&type=${encodeURIComponent(contentType)}`;
  }

  try {
    /* @vite-ignore */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

    const client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
    const command = new PutObjectCommand({
      Bucket: RESUME_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch {
    return `https://${RESUME_BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(key)}?mock-presigned=true`;
  }
}

/**
 * Generates an S3 presigned URL for downloading a tailored resume PDF.
 */
export async function getDownloadPresignedUrl(key: string): Promise<string> {
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_REGION) {
    return `https://${RESUME_BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(key)}?mock-download=true`;
  }

  try {
    /* @vite-ignore */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

    const client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
    const command = new GetObjectCommand({
      Bucket: RESUME_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch {
    return `https://${RESUME_BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(key)}?mock-download=true`;
  }
}
