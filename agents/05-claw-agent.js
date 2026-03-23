const fs = require('fs');
const path = require('path');
const http = require('http');
const { callLlm, getCommandSystemPrompt, loadEnv, runCommand } = require('../utils');

const API_PORT = 3000;
const WEB_PORT = 8000;
const WEB_ROOT = path.resolve(__dirname, '..', 'public', 'claw');

function getSkillFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getSkillFiles(fullPath));
      continue;
    }

    if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function loadSkills() {
  const skillsDir = path.resolve(__dirname, '..', 'skills');
  const files = getSkillFiles(skillsDir);

  return files.map((file) => ({
    role: 'system',
    content: fs.readFileSync(file, 'utf8'),
  }));
}

function getCommand(text) {
  const fencedMatch = text.match(/```(?:text|bash)?\s*\n## exec:\s*([\s\S]*?)\n```/);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const inlineMatch = text.match(/`## exec:\s*([\s\S]*?)`/);

  if (inlineMatch) {
    return inlineMatch[1].trim();
  }

  const rawMatch = text.match(/## exec:\s*([\s\S]*)$/);

  if (rawMatch) {
    return rawMatch[1].trim();
  }

  return null;
}

async function resolveAgentReply(messages) {
  while (true) {
    const answer = await callLlm(messages);

    if (!answer) {
      return '';
    }

    const command = getCommand(answer);

    if (!command) {
      return answer;
    }

    const result = await runCommand(command);

    messages.push({
      role: 'assistant',
      content: answer,
    });

    messages.push({
      role: 'user',
      content: `以下是命令执行结果，请基于结果继续：\n\n${result}`,
    });
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const typeMap = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };
  const contentType = typeMap[ext] || 'text/plain; charset=utf-8';
  const content = fs.readFileSync(filePath);

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

async function handleApi(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    sendJson(res, 404, { error: 'Not Found' });
    return;
  }

  try {
    const { message = '', history = [] } = await readJsonBody(req);
    const safeHistory = Array.isArray(history)
      ? history
          .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
          .map((item) => ({ role: item.role, content: item.content }))
      : [];

    const messages = [
      {
        role: 'system',
        content: getCommandSystemPrompt(),
      },
      ...loadSkills(),
      ...safeHistory,
      { role: 'user', content: message },
    ];

    const reply = await resolveAgentReply(messages);

    sendJson(res, 200, {
      reply,
      history: [
        ...safeHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ],
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

function handleWeb(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(WEB_ROOT, safePath);

  if (!filePath.startsWith(WEB_ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  sendFile(res, filePath);
}

async function main() {
  loadEnv();

  const apiServer = http.createServer((req, res) => {
    handleApi(req, res);
  });

  const webServer = http.createServer((req, res) => {
    handleWeb(req, res);
  });

  apiServer.listen(API_PORT, () => {
    console.log(`API server: http://localhost:${API_PORT}`);
  });

  webServer.listen(WEB_PORT, () => {
    console.log(`Web server: http://localhost:${WEB_PORT}`);
  });
}

main();
