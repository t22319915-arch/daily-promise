# 天父每日應許（daily-promise）

靜態單頁網站＋GitHub Pages：每日一則應許經文，可翻閱與回到今天。

## 範圍

- 做：頁面、資料（`data/daily-promises.json`）、PWA（`sw.js`）、GitHub Pages 部署。
- 不做：後端服務、會員系統、CMS。

## 技術棧

- 純 HTML／CSS／JavaScript（`index.html`、`app.js`、`styles.css`）。
- 資料由 `scripts/extract.py` 產生 `data/daily-promises.json`。
- 部署：`.github/workflows/deploy.yml`，push `main` 觸發 GitHub Pages。
- 網站：<https://t22319915-arch.github.io/daily-promise/>

## 目錄

```text
天父每日應許/
  index.html, app.js, styles.css, sw.js, favicon.svg
  data/daily-promises.json     每日資料（約 460 KB）
  images/                      封面與 logo
  scripts/extract.py           資料產生腳本
  .github/workflows/deploy.yml Pages 部署
  PROGRESS.md                  專案進度
```

## 工作規則

1. 繁體中文（台灣用語）介面與說明。
2. 修改資料前先備份 `data/daily-promises.json`；`extract.py` 的來源檔不在 repo 內，需先確認。
3. push `main` 即部署；推送前先在瀏覽器確認 3 個日期。
4. 不把大檔（>10 MB）或產出暫存放進 repo。
5. 不改寫已發布日期的經文內容，除非使用者明確要求。

## 決策紀錄

- 2026-10-28：從 GitHub clone 到 `D:\AI-Projects\天父每日應許` 作為本機正本（Tier 2 搬遷）；Synology 舊資料夾不再編輯。

## 進度

- 專案內進度：`PROGRESS.md`
- 駕駛艙：`D:\AI-Projects\opencode-notes\cockpit\天父每日應許.md`

最後更新：2026-10-28
