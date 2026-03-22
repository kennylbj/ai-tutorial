# AI Agent Tutorial

这是一个用于教学的大模型 Agent 示例项目，目标是用尽量少的代码，逐步展示 Agent 能力如何从“单次问答”扩展到“多轮对话”“命令执行”“技能加载”以及“浏览器端交互”。

项目当前默认使用阿里云百炼的 OpenAI 兼容接口，通过 `openai` Node SDK 调用模型。

## 项目目的

- 展示从零开始搭建简单 Agent 的基本方式
- 用渐进式示例说明不同 Agent 能力之间的差异
- 提供一个可以直接运行、便于讲解和修改的最小代码库

## Agent 列表

### Agent 1: 基础问答

文件：[agents/01-basic.js](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/agents/01-basic.js)

作用：

- 向大模型发送一个固定问题
- 获取并打印回答

运行：

```bash
npm run agent:1
```

### Agent 2: 多轮对话

文件：[agents/02-chat-loop.js](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/agents/02-chat-loop.js)

作用：

- 使用 `while` 循环持续接收用户输入
- 在程序退出前反复与模型对话
- 保存本次终端会话中的上下文

运行：

```bash
npm run agent:2
```

### Agent 3: 命令执行 Agent

文件：[agents/03-command-agent.js](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/agents/03-command-agent.js)

作用：

- 支持模型通过特殊格式请求本地执行命令
- 约定格式为：`## exec: <command>`
- 命令执行完成后，将结果继续反馈给模型

运行：

```bash
npm run agent:3
```

### Agent 4: Skill Agent

文件：[agents/04-skill-agent.js](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/agents/04-skill-agent.js)

作用：

- 启动时读取 `./skills` 目录中的所有 Markdown 文件
- 将这些技能说明作为 `system prompts` 传给模型
- 同时保留命令执行能力

当前示例技能：

- `skills/news-skill.md`
  让 Agent 在用户询问最新新闻、今日热点时抓取 36Kr RSS
- `skills/ppt-skill/skill.md`
  让 Agent 生成 PPT，并调用 Python 脚本输出 `.pptx`

运行：

```bash
npm run agent:4
```

### Agent 5: Claw Agent

文件：[agents/05-claw-agent.js](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/agents/05-claw-agent.js)

作用：

- 启动本地 HTTP 对话接口：`3000` 端口
- 启动静态浏览器页面：`8000` 端口
- 支持浏览器端对话
- 支持 skill 加载和命令执行
- 支持浏览器侧临时会话上下文

浏览器页面文件：

- [public/claw/index.html](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/public/claw/index.html)

运行：

```bash
npm run agent:5
```

启动后访问：

```text
http://localhost:8000
```

## 公共模块

### utils.js

文件：[utils.js](/Users/fishdicks/Desktop/workspace/llm/ai-tutorial/utils.js)

作用：

- 读取 `.env`
- 提供统一的 `callLlm(messages)` 方法

## 环境准备

### 1. Node 依赖

安装项目依赖：

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件，并至少配置：

```env
DASHSCOPE_API_KEY=your_dashscope_api_key
```

说明：

- 当前代码主要使用 `DASHSCOPE_API_KEY`

### 3. PPT 技能的 Python 依赖

如果要使用 PPT skill，需要安装 `python-pptx`。

推荐使用虚拟环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install python-pptx
```

## Skills 目录说明

`skills` 目录中的 `.md` 文件会被 Agent 4 和 Agent 5 自动加载。

你可以继续按这个结构扩展新的技能：

```text
skills/
  news-skill.md
  ppt-skill/
    skill.md
    generate_ppt.py
```

其中：

- `skill.md` 负责描述技能规则
- 附带脚本可作为命令执行目标

## 命令约定

本项目中，命令执行类 Agent 使用如下约定：

```text
## exec: <command>
```

当模型输出该格式时，程序会在本地执行命令，并把结果继续交给模型处理。

## 注意事项

- 本项目主要用于教学示例，不是生产级 Agent 框架
- 命令执行能力具有风险，运行前应确认命令来源可信
