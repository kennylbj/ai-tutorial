const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const OpenAI = require('openai');

const execAsync = promisify(exec);

function loadEnv() {
  const envText = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');

  for (const rawLine of envText.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const [key, ...valueParts] = line.split('=');
    process.env[key.trim()] = valueParts.join('=').trim();
  }
}

function getCommandShell() {
  if (process.platform === 'win32') {
    return process.env.ComSpec || 'cmd.exe';
  }

  return process.env.SHELL || '/bin/sh';
}

function getPlatformLabel() {
  if (process.platform === 'win32') {
    return 'Windows';
  }

  if (process.platform === 'darwin') {
    return 'macOS';
  }

  return 'Linux';
}

function getCommandSystemPrompt() {
  const platform = getPlatformLabel();
  const shell = getCommandShell();

  return [
    '你是一个可以调用本地命令的助手。',
    `当前运行平台: ${platform} (${process.platform})。`,
    `当前命令解释器: ${shell}。`,
    '生成命令时必须兼容当前平台和当前命令解释器。',
    'Windows 上优先使用 cmd 可执行的命令；Linux / macOS 上使用 POSIX shell 命令。',
    '当且仅当你需要程序在本地执行命令时，必须只输出一行：## exec: <command>',
    '不要输出代码块，不要解释，不要添加第二行。',
    '如果你已经拿到了足够信息，直接正常回答用户，不要再输出 ## exec:。',
  ].join('\n');
}

async function runCommand(command) {
  try {
    const result = await execAsync(command, {
      shell: getCommandShell(),
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });

    return [
      `命令: ${command}`,
      '退出码: 0',
      `标准输出:\n${result.stdout || '(空)'}`,
      `标准错误:\n${result.stderr || '(空)'}`,
    ].join('\n\n');
  } catch (error) {
    const exitCode = Number.isInteger(error.code) ? error.code : 1;

    return [
      `命令: ${command}`,
      `退出码: ${exitCode}`,
      `标准输出:\n${error.stdout || '(空)'}`,
      `标准错误:\n${error.stderr || error.message}`,
    ].join('\n\n');
  }
}

async function callLlm(messages) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    const completion = await openai.chat.completions.create({
      model: 'qwen3.5-397b-a17b',
      messages,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.log(`调用大模型失败: ${error.message}`);
  }
}

module.exports = {
  callLlm,
  getCommandSystemPrompt,
  loadEnv,
  runCommand,
};
