import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs';
import path from 'node:path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET = process.env.S3_BUCKET || 'telemed-docs';
const TTL = parseInt(process.env.SIGNED_URL_TTL_SECONDS || '900');

export async function uploadLocalFileAndGetSignedUrl(
  localPath: string, 
  s3Key: string, 
  contentType: string = 'application/pdf'
) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
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
  const signedUrl = await getSignedUrl(s3Client, uploadCommand, { 
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