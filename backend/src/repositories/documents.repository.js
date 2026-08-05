const fs = require('node:fs/promises');

const documentsById = new Map();

function saveMetadata(documentMetadata) {
  documentsById.set(documentMetadata.id, documentMetadata);
  return documentMetadata;
}

function listMetadata() {
  return Array.from(documentsById.values());
}

function findMetadataById(id) {
  return documentsById.get(id) || null;
}

async function fileExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  saveMetadata,
  listMetadata,
  findMetadataById,
  fileExists,
};
