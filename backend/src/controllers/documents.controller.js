const documentsService = require('../services/documents.service');

function handleServiceError(res, error) {
  if (error instanceof documentsService.ServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
}

function createDocument(req, res) {
  try {
    const owner = req.body?.owner;
    const created = documentsService.createDocument({
      file: req.file,
      owner,
    });

    return res.status(201).json(created);
  } catch (error) {
    return handleServiceError(res, error);
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentsService.listDocuments();
    return res.status(200).json(documents);
  } catch (error) {
    return handleServiceError(res, error);
  }
}

async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const fileInfo = await documentsService.getDocumentForDownload(id);

    return res.download(fileInfo.absolutePath, fileInfo.originalName);
  } catch (error) {
    return handleServiceError(res, error);
  }
}

module.exports = {
  createDocument,
  listDocuments,
  downloadDocument,
};
