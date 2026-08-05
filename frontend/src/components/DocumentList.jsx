import DownloadButton from './DownloadButton';

function formatDate(isoDateString) {
  if (!isoDateString) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDateString));
}

export default function DocumentList({
  documents,
  isLoading,
  downloadingDocumentId,
  onDownload,
}) {
  return (
    <section>
      <h2>Documentos enviados</h2>

      {isLoading ? <p>Carregando documentos...</p> : null}

      {!isLoading && documents.length === 0 ? (
        <p>Nenhum documento cadastrado ate o momento.</p>
      ) : null}

      {!isLoading && documents.length > 0 ? (
        <ul>
          {documents.map((document) => {
            const isDownloading = downloadingDocumentId === document.id;

            return (
              <li key={document.id}>
                <strong>{document.originalName}</strong>
                <p>Tamanho: {document.size} bytes</p>
                <p>Dono: {document.owner}</p>
                <p>Enviado em: {formatDate(document.uploadedAt)}</p>

                <DownloadButton
                  document={document}
                  onDownload={onDownload}
                  isDownloading={isDownloading}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
