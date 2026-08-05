const API_PREFIX = '/api';

function buildApiUrl(path) {
  return `${API_PREFIX}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildApiUrl(path), options);

  if (!response.ok) {
    let message = 'Nao foi possivel concluir a requisicao.';

    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // Mantem a mensagem padrao quando nao ha corpo JSON de erro.
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response;
}

function getFileNameFromDisposition(contentDispositionHeader) {
  if (!contentDispositionHeader) {
    return null;
  }

  const utf8Match = contentDispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fallbackMatch = contentDispositionHeader.match(/filename="?([^";]+)"?/i);
  return fallbackMatch?.[1] || null;
}

function saveBlobAsFile(blob, fileName) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(blobUrl);
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function uploadDocument({ owner, file }) {
  const payload = new FormData();
  payload.append('owner', owner);
  payload.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: payload,
  });

  return response.json();
}

export async function downloadDocument({ id, defaultFileName }) {
  const response = await request(`/documents/${id}/download`);
  const blob = await response.blob();

  const contentDisposition = response.headers.get('content-disposition');
  const parsedFileName = getFileNameFromDisposition(contentDisposition);
  const fileName = parsedFileName || defaultFileName || `document-${id}`;

  saveBlobAsFile(blob, fileName);
}
