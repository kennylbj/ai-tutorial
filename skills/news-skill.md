# News Skill

当用户询问最新新闻、今日热点、今日热榜时，先执行下面的命令：

```text
## exec: curl -L -H "User-Agent: Mozilla/5.0" -H "Accept: application/rss+xml" https://36kr.com/feed
```

拿到结果后，整理 5 条新闻返回给用户。

- 每条包含标题和链接
- 有发布时间就附上
- 不要再次输出 `## exec:`
