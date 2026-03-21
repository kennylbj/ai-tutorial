# PPT Skill

当用户需要创建 PPT 文件时，直接输出一条命令：

`## exec: python skills/ppt-skill/generate_ppt.py '<json字符串>' output.pptx`

`<json字符串>` 的格式如下：

```json
{
  "slides": [
    {
      "title": "标题1",
      "content": ["要点1", "要点2"]
    }
  ]
}
```

要求：

- 一次只输出一条 `## exec:`
- JSON 字符串使用单引号包裹
- JSON 内部字段使用双引号
