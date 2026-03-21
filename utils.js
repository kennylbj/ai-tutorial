const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

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
  loadEnv,
};
