const path = require('node:path');
const { randomUUID } = require('node:crypto');

const documentsRepository = require('../repositories/documents.repository');

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

function toPublicMetadata(documentMetadata) {
  return {
    id: documentMetadata.id,
    originalName: documentMetadata.originalName,
    size: documentMetadata.size,
    owner: documentMetadata.owner,
    uploadedAt: documentMetadata.uploadedAt,
  };
}

function createDocument({ file, owner }) {
  if (!owner || !owner.trim()) {
    throw new ServiceError('Campo owner é obrigatório.', 400);
  }

  if (!file) {
    throw new ServiceError('Arquivo é obrigatório.', 400);
  }

  const id = randomUUID();
  const uploadedAt = new Date().toISOString();
  const documentMetadata = {
    id,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    owner: owner.trim(),
    uploadedAt,
    storagePath: buildStoragePath(file.filename),
    absolutePath: file.path,
  };

  documentsRepository.saveMetadata(documentMetadata);

  return documentMetadata;
}

function listDocuments() {
  return documentsRepository.listMetadata().map(toPublicMetadata);
}

async function getDocumentForDownload(id) {
  const documentMetadata = documentsRepository.findMetadataById(id);

  if (!documentMetadata) {
    throw new ServiceError('Documento não encontrado.', 404);
  }

  const exists = await documentsRepository.fileExists(documentMetadata.absolutePath);

  if (!exists) {
    throw new ServiceError('Arquivo do documento não encontrado no armazenamento local.', 404);
  }

  return {
    absolutePath: documentMetadata.absolutePath,
    originalName: documentMetadata.originalName,
    mimeType: documentMetadata.mimeType,
  };
}

module.exports = {
  ServiceError,
  createDocument,
  listDocuments,
  getDocumentForDownload,
};
