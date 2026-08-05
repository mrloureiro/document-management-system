import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [owner, setOwner] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    if (!owner.trim()) {
      setLocalError('Informe o nome do usuario responsavel.');
      return;
    }

    if (!selectedFile) {
      setLocalError('Selecione um arquivo para upload.');
      return;
    }

    try {
      await onUpload({
        owner: owner.trim(),
        file: selectedFile,
      });

      setSelectedFile(null);
      setOwner('');
      event.target.reset();
    } catch {
      // O erro de API e exibido na App para centralizar o feedback.
    }
  }

  function handleFileChange(event) {
    const [file] = event.target.files || [];
    setSelectedFile(file || null);
  }

  return (
    <section>
      <h2>Upload de documento</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="owner">Usuario</label>
        <input
          id="owner"
          name="owner"
          type="text"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Ex.: Maria"
          disabled={isUploading}
        />

        <label htmlFor="file">Arquivo</label>
        <input
          id="file"
          name="file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>

      {localError ? <p>{localError}</p> : null}
    </section>
  );
}
