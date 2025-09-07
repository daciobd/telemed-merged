// Serviço S3 com URLs assinadas e TTL
import AWS from 'aws-sdk';

const {
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET = 'telemed-mda-files',
  S3_REGION = 'us-east-1'
} = process.env;

// Configurar AWS S3
const s3 = new AWS.S3({
  accessKeyId: S3_ACCESS_KEY_ID,
  secretAccessKey: S3_SECRET_ACCESS_KEY,
  region: S3_REGION,
  signatureVersion: 'v4'
});

// Gerar URL assinada para upload
export async function generateSignedUploadUrl(key, contentType, expiresIn = 3600) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn, // TTL em segundos
      ACL: 'private'
    };
    
    const signedUrl = await s3.getSignedUrlPromise('putObject', params);
    
    return {
      success: true,
      signedUrl,
      key,
      bucket: S3_BUCKET,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      ttl: expiresIn
    };
  } catch (error) {
    console.error('[S3] Erro ao gerar URL de upload:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Gerar URL assinada para download
export async function generateSignedDownloadUrl(key, expiresIn = 3600) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Expires: expiresIn
    };
    
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    
    return {
      success: true,
      signedUrl,
      key,
      bucket: S3_BUCKET,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      ttl: expiresIn
    };
  } catch (error) {
    console.error('[S3] Erro ao gerar URL de download:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Upload direto para S3 (para uso interno)
export async function uploadFile(key, buffer, contentType, metadata = {}) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        service: 'medical-desk-advanced'
      },
      ACL: 'private'
    };
    
    const result = await s3.upload(params).promise();
    
    return {
      success: true,
      location: result.Location,
      key: result.Key,
      etag: result.ETag,
      bucket: result.Bucket
    };
  } catch (error) {
    console.error('[S3] Erro no upload:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Deletar arquivo do S3
export async function deleteFile(key) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    
    return {
      success: true,
      key,
      deleted: true
    };
  } catch (error) {
    console.error('[S3] Erro ao deletar arquivo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Listar arquivos com prefixo
export async function listFiles(prefix = '', maxKeys = 100) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys
    };
    
    const result = await s3.listObjectsV2(params).promise();
    
    const files = result.Contents.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag
    }));
    
    return {
      success: true,
      files,
      count: files.length,
      isTruncated: result.IsTruncated,
      nextContinuationToken: result.NextContinuationToken
    };
  } catch (error) {
    console.error('[S3] Erro ao listar arquivos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Verificar se arquivo existe
export async function fileExists(key) {
  try {
    await s3.headObject({ Bucket: S3_BUCKET, Key: key }).promise();
    return { success: true, exists: true };
  } catch (error) {
    if (error.code === 'NotFound') {
      return { success: true, exists: false };
    }
    return { success: false, error: error.message };
  }
}

// Gerar chave única para arquivo
export function generateFileKey(consultationId, type, extension) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `mda/${type}/${consultationId}/${timestamp}-${random}.${extension}`;
}

// Configurações de TTL por tipo de arquivo
export const TTL_CONFIGS = {
  prescription_pdf: 7 * 24 * 3600, // 7 dias
  consultation_recording: 30 * 24 * 3600, // 30 dias
  ai_analysis_report: 15 * 24 * 3600, // 15 dias
  temporary_upload: 1 * 3600, // 1 hora
  session_document: 24 * 3600 // 24 horas
};

// Obter TTL recomendado para tipo de arquivo
export function getRecommendedTTL(fileType) {
  return TTL_CONFIGS[fileType] || TTL_CONFIGS.temporary_upload;
}