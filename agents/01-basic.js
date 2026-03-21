const { callLlm, loadEnv } = require('../utils');

async function main() {
  loadEnv();

  const question = '请用一句话解释什么是大模型 agent。';
  const answer = await callLlm([
    { role: 'user', content: question },
  ]);

  console.log(`问题: ${question}`);
  console.log('');
  console.log('回答:');
  console.log(answer);
}

main();
