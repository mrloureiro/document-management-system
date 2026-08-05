const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

// Helpers para testes de endpoints

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function request(server, options, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.request({ host: '127.0.0.1', port, ...options }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json;
        try { json = JSON.parse(raw); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function buildMultipartBody(boundary, fields, file) {
  const lines = [];
  for (const [name, value] of Object.entries(fields)) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${name}"`);
    lines.push('');
    lines.push(value);
  }
  lines.push(`--${boundary}`);
  lines.push(`Content-Disposition: form-data; name="file"; filename="${file.name}"`);
  lines.push(`Content-Type: ${file.mimeType}`);
  lines.push('');
  lines.push(file.content);
  lines.push(`--${boundary}--`);
  return lines.join('\r\n');
}

// Testes de endpoints

test('GET /health retorna status ok', async () => {
  const server = await startServer();
  try {
    const res = await request(server, { method: 'GET', path: '/health' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /upload - retorna 400 quando nenhum arquivo é enviado', async () => {
  const server = await startServer();
  try {
    const boundary = 'testboundary123';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="owner"\r\n\r\njoao\r\n--${boundary}--`;
    const res = await request(server, {
      method: 'POST',
      path: '/upload',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /upload - retorna 400 quando owner está ausente', async () => {
  const server = await startServer();
  try {
    const boundary = 'testboundary456';
    const body = buildMultipartBody(boundary, {}, {
      name: 'test.txt',
      mimeType: 'text/plain',
      content: 'conteudo de teste',
    });
    const res = await request(server, {
      method: 'POST',
      path: '/upload',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /upload - faz upload com sucesso e GET /documents lista o documento', async () => {
  const server = await startServer();
  try {
    const boundary = 'testboundary789';
    const body = buildMultipartBody(boundary, { owner: 'alice' }, {
      name: 'hello.txt',
      mimeType: 'text/plain',
      content: 'hello world',
    });
    const uploadRes = await request(server, {
      method: 'POST',
      path: '/upload',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    assert.strictEqual(uploadRes.status, 201);
    assert.ok(uploadRes.body.id, 'deve retornar um id');
    assert.strictEqual(uploadRes.body.originalName, 'hello.txt');
    assert.strictEqual(uploadRes.body.owner, 'alice');

    const uploadedId = uploadRes.body.id;

    // Listar documentos deve incluir o documento recém-enviado
    const listRes = await request(server, { method: 'GET', path: '/documents' });
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body), 'resposta deve ser um array');
    const found = listRes.body.find((d) => d.id === uploadedId);
    assert.ok(found, 'documento enviado deve aparecer na listagem');
    assert.strictEqual(found.originalName, 'hello.txt');
    assert.strictEqual(found.owner, 'alice');

    // Limpa o arquivo gravado em disco
    if (uploadRes.body.absolutePath && fs.existsSync(uploadRes.body.absolutePath)) {
      fs.unlinkSync(uploadRes.body.absolutePath);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /documents/:id/download - retorna 404 para id inexistente', async () => {
  const server = await startServer();
  try {
    const res = await request(server, {
      method: 'GET',
      path: '/documents/id-que-nao-existe/download',
    });
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /documents/:id/download - faz download do arquivo enviado', async () => {
  const server = await startServer();
  try {
    const boundary = 'testboundaryabc';
    const fileContent = 'conteudo para download';
    const body = buildMultipartBody(boundary, { owner: 'bob' }, {
      name: 'download.txt',
      mimeType: 'text/plain',
      content: fileContent,
    });
    const uploadRes = await request(server, {
      method: 'POST',
      path: '/upload',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    assert.strictEqual(uploadRes.status, 201);
    const { id } = uploadRes.body;

    const downloadRes = await request(server, {
      method: 'GET',
      path: `/documents/${id}/download`,
    });

    assert.strictEqual(downloadRes.status, 200);
    assert.ok(
      downloadRes.headers['content-disposition']?.includes('download.txt'),
      'content-disposition deve conter o nome do arquivo'
    );

    // Limpa o arquivo gravado em disco
    if (uploadRes.body.absolutePath && fs.existsSync(uploadRes.body.absolutePath)) {
      fs.unlinkSync(uploadRes.body.absolutePath);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
