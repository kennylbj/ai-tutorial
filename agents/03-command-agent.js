const readline = require('readline/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { stdin: input, stdout: output } = require('process');
const { callLlm, loadEnv } = require('../utils');

const execAsync = promisify(exec);

function getCommand(text) {
  const match = text.trim().match(/^## exec:\s*(.+)$/);

  if (!match) {
    return null;
  }

  return match[1];
}

async function runCommand(command) {
  try {
    const result = await execAsync(command, {
      shell: '/bin/zsh',
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });

    return [
      `命令: ${command}`,
      `退出码: 0`,
      `标准输出:\n${result.stdout || '(空)'}`,
      `标准错误:\n${result.stderr || '(空)'}`,
    ].join('\n\n');
  } catch (error) {
    return [
      `命令: ${command}`,
      `退出码: ${error.code || 1}`,
      `标准输出:\n${error.stdout || '(空)'}`,
      `标准错误:\n${error.stderr || error.message}`,
    ].join('\n\n');
  }
}

async function main() {
  loadEnv();

  const rl = readline.createInterface({ input, output });
  const messages = [
    {
      role: 'system',
      content: [
        '你是一个可以调用本地命令的助手。',
        '当且仅当你需要程序在本地执行命令时，必须只输出一行：## exec: <command>',
        '不要输出代码块，不要解释，不要添加第二行。',
        '如果你已经拿到了足够信息，直接正常回答用户，不要再输出 ## exec:。',
      ].join('\n'),
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
