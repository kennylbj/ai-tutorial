const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const { callLlm, getCommandSystemPrompt, loadEnv, runCommand } = require('../utils');

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

  return files.map((file) => {
    const content = fs.readFileSync(file, 'utf8');

    return {
      role: 'system',
      content,
    };
  });
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

async function main() {
  loadEnv();

  const rl = readline.createInterface({ input, output });
  const skillPrompts = loadSkills();
  const messages = [
    {
      role: 'system',
      content: getCommandSystemPrompt(),
    },
    ...skillPrompts,
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
