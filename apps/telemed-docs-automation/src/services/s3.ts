import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs';

const BUCKET = process.env.S3_BUCKET || 'telemed-docs';
const TTL = parseInt(process.env.SIGNED_URL_TTL_SECONDS || '900');

// Initialize S3 client only if credentials are available
let s3Client: S3Client | null = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

export async function uploadLocalFileAndGetSignedUrl(
  localPath: string, 
  s3Key: string, 
  contentType: string = 'application/pdf'
) {
  if (!s3Client) {
    throw new Error('S3 not configured - missing AWS credentials');
  }

  // Upload file to S3
  const fileBuffer = fs.readFileSync(localPath);
  const uploadCommand = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
    ServerSideEncryption: 'AES256'
  });

  await s3Client.send(uploadCommand);

  // Generate signed URL for download
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key
  });
  
  const signedUrl = await getSignedUrl(s3Client, getCommand, { 
    expiresIn: TTL 
  });

  return {
    uploaded: true,
    bucket: BUCKET,
    key: s3Key,
    signedUrl,
    expiresIn: TTL
  };
}