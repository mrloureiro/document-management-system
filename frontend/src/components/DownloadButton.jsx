export default function DownloadButton({ document, onDownload, isDownloading }) {
  return (
    <button
      type="button"
      onClick={() => onDownload(document)}
      disabled={isDownloading}
    >
      {isDownloading ? 'Baixando...' : 'Download'}
    </button>
  );
}
