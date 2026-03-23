const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { callLlm, getCommandSystemPrompt, loadEnv, runCommand } = require('../utils');

function getCommand(text) {
  const match = text.trim().match(/^## exec:\s*(.+)$/);

  if (!match) {
    return null;
  }

  return match[1];
}

async function main() {
  loadEnv();

  const rl = readline.createInterface({ input, output });
  const messages = [
    {
      role: 'system',
      content: getCommandSystemPrompt(),
    },
  ];

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

    while (true) {
      const answer = await callLlm(messages);

      if (!answer) {
        break;
      }

      const command = getCommand(answer);

      if (!command) {
        messages.push({
          role: 'assistant',
          content: answer,
        });

        console.log(`AI: ${answer}`);
        console.log('');
        break;
      }

      console.log(`执行命令: ${command}`);

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

  rl.close();
}

main();
