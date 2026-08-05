const path = require('node:path');
const { randomUUID } = require('node:crypto');

const documentsRepository = require('../repositories/documents.repository');

const ERROR_MESSAGES = {
  OWNER_REQUIRED: 'Campo owner é obrigatório.',
  FILE_REQUIRED: 'Arquivo é obrigatório.',
  DOCUMENT_NOT_FOUND: 'Documento não encontrado.',
  STORED_FILE_NOT_FOUND: 'Arquivo do documento não encontrado no armazenamento local.',
};

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

function buildStoragePath(filename) {
  return path.join('storage', filename);
}

function throwServiceError(message, statusCode) {
  throw new ServiceError(message, statusCode);
}

function normalizeOwner(owner) {
  if (typeof owner !== 'string') {
    return '';
  }

  return owner.trim();
}

function validateOwner(owner) {
  const normalizedOwner = normalizeOwner(owner);

  if (!normalizedOwner) {
    throwServiceError(ERROR_MESSAGES.OWNER_REQUIRED, 400);
  }

  return normalizedOwner;
}

function validateFile(file) {
  if (!file) {
    throwServiceError(ERROR_MESSAGES.FILE_REQUIRED, 400);
  }

  return file;
}

function createDocumentMetadata({ id, owner, file, uploadedAt }) {
  return {
    id,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    owner,
    uploadedAt,
    storagePath: buildStoragePath(file.filename),
    absolutePath: file.path,
  };
}

function toPublicMetadata(documentMetadata) {
  return {
    id: documentMetadata.id,
    originalName: documentMetadata.originalName,
    size: documentMetadata.size,
    owner: documentMetadata.owner,
    uploadedAt: documentMetadata.uploadedAt,
  };
}

function ensureDocumentExists(id) {
  const documentMetadata = documentsRepository.findMetadataById(id);

  if (!documentMetadata) {
    throwServiceError(ERROR_MESSAGES.DOCUMENT_NOT_FOUND, 404);
  }

  return documentMetadata;
}

async function ensureStoredFileExists(absolutePath) {
  const exists = await documentsRepository.fileExists(absolutePath);

  if (!exists) {
    throwServiceError(ERROR_MESSAGES.STORED_FILE_NOT_FOUND, 404);
  }
}

function toDownloadInfo(documentMetadata) {
  return {
    absolutePath: documentMetadata.absolutePath,
    originalName: documentMetadata.originalName,
    mimeType: documentMetadata.mimeType,
  };
}

function createDocument({ file, owner }) {
  const normalizedOwner = validateOwner(owner);
  const validatedFile = validateFile(file);

  const id = randomUUID();
  const uploadedAt = new Date().toISOString();
  const documentMetadata = createDocumentMetadata({
    id,
    owner: normalizedOwner,
    file: validatedFile,
    uploadedAt,
  });

  documentsRepository.saveMetadata(documentMetadata);

  return documentMetadata;
}

function listDocuments() {
  return documentsRepository.listMetadata().map(toPublicMetadata);
}

async function getDocumentForDownload(id) {
  const documentMetadata = ensureDocumentExists(id);
  await ensureStoredFileExists(documentMetadata.absolutePath);

  return toDownloadInfo(documentMetadata);
}

module.exports = {
  ServiceError,
  createDocument,
  listDocuments,
  getDocumentForDownload,
};
