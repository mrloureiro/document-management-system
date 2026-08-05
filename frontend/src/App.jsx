import { useCallback, useEffect, useState } from 'react';

import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from './services/documents.api';

function getErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsListLoading(true);

    try {
      const loadedDocuments = await listDocuments();
      setDocuments(loadedDocuments);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, 'Nao foi possivel carregar a lista de documentos.')
      );
    } finally {
      setIsListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = useCallback(
    async ({ owner, file }) => {
      setErrorMessage('');
      setSuccessMessage('');
      setIsUploading(true);

      try {
        await uploadDocument({ owner, file });
        setSuccessMessage('Documento enviado com sucesso.');
        await loadDocuments();
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error, 'Nao foi possivel enviar o documento.')
        );
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [loadDocuments]
  );

  const handleDownload = useCallback(async (document) => {
    setErrorMessage('');
    setSuccessMessage('');
    setDownloadingDocumentId(document.id);

    try {
      await downloadDocument({
        id: document.id,
        defaultFileName: document.originalName,
      });
      setSuccessMessage('Download iniciado com sucesso.');
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, 'Nao foi possivel baixar o documento.')
      );
    } finally {
      setDownloadingDocumentId('');
    }
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      {errorMessage ? <p>{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}

      <UploadComponent onUpload={handleUpload} isUploading={isUploading} />

      <DocumentList
        documents={documents}
        isLoading={isListLoading}
        downloadingDocumentId={downloadingDocumentId}
        onDownload={handleDownload}
      />
    </main>
  );
}
