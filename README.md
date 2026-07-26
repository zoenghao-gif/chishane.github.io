# 今天吃什么

移动端优先的外卖店铺随机抽选工具。历史记录保存在本地 Node.js 后端管理的 SQLite 文件，不使用 `localStorage` 保存业务数据。

## 本地启动

1. 安装 Node.js 22.5 或更高版本。
2. 执行 `pnpm install`。
3. 执行 `pnpm dev`。

前端地址为 `http://127.0.0.1:5173`，本地后端地址为 `http://127.0.0.1:8787`。首次运行会自动创建 `data/what-to-eat.sqlite`。

## 检查

```text
pnpm test
pnpm build
pnpm test:e2e
```

## 本地生产预览

- 执行 `pnpm build`。
- 执行 `pnpm start`。
- 浏览器打开 `http://127.0.0.1:8787`。

数据库文件位于 `data/what-to-eat.sqlite`。删除该文件会清空本地数据。
