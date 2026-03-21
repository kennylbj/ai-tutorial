const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { callLlm, loadEnv } = require('../utils');

async function main() {
  loadEnv();

  const rl = readline.createInterface({ input, output });
  const messages = [];

  console.log('开始聊天吧，输入 exit 结束对话。');

  while (true) {
    const question = await rl.question('你: ');

    if (question === 'exit') {
      break;
    }

    messages.push({
      role: 'user',
      content: question,
    });

    const answer = await callLlm(messages);

    messages.push({
      role: 'assistant',
      content: answer,
    });

    console.log(`AI: ${answer}`);
    console.log('');
  }

  rl.close();
}

main();
