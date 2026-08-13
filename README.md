# 阿是要不要好好吃飯｜Dinner Intelligence

以「飯局智慧」為核心的專業 Web 應用，協助使用者在商務或社交飯局的局前、局中、局後進行策略規劃、人際觀察與行動復盤。本 repository 同時保留原始課程知識庫的 Markdown 備份。

## 已實作功能

| 模組 | 說明 |
| --- | --- |
| 局前規劃 | 依人數、菜系、時段、目標、局別與對話推進深度，推薦對應策略條目。 |
| 七大角色 | 資源人、需求人、橋接人、主持人、氣氛人、觀察人、干擾人的定義、訊號與策略。 |
| 五局十五層 | 破冰、探索、推進、成交、關係五局；每局均有三層對話推進深度。 |
| 六大部分知識庫 | 依目標與框架、人物與角色、場景、時機、話題與五局、實戰與長期養成瀏覽。 |
| 新手引導 | 30 秒選擇指南、層次防呆提示及三個可一鍵套用的模擬飯局。 |
| 登入與紀錄 | 僅使用 Manus OAuth；登入後可儲存飯局紀錄、局後筆記與常用情境。 |
| 智慧建議 | 由課程知識庫約束 LLM 回覆，提供話題、角色策略、風險提醒與局後復盤。 |

> Q&A 課程條目保存在底層資料與 `knowledge/` 備份中，但不顯示於公開前台、局前推薦或智慧建議內容。

## 技術架構

| 層級 | 技術 |
| --- | --- |
| 前端 | React 19、Vite、Tailwind CSS、shadcn/ui、tRPC React Query |
| 後端 | Express、tRPC、Manus OAuth |
| 資料庫 | MySQL/TiDB、Drizzle ORM |
| 智慧建議 | Manus 內建 LLM；伺服器端知識庫來源約束與備援策略 |
| 測試 | Vitest、Testing Library |

## 專案結構

```text
client/       前端頁面、元件與樣式
server/       tRPC 路由、資料存取與 LLM 邏輯
drizzle/      資料庫 schema 與遷移檔
docs/         MVP 規格、驗證紀錄、新手引導說明
knowledge/    六大部分、七大角色、五局十五層的 Markdown 備份
shared/       前後端共用型別與常數
```

## 本機啟動

請先設定模板所需的資料庫、Manus OAuth 與內建服務環境變數，再安裝並啟動。

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

資料庫 schema 與資料遷移方式請參考 `drizzle/`。若要理解產品定位、現有能力、可調整位置與後續應用方向，請先閱讀 [`docs/PRD.md`](docs/PRD.md)。功能範圍請見 [`docs/MVP_SPEC.md`](docs/MVP_SPEC.md)，情境引導規則請見 [`docs/SCENARIO_GUIDANCE_SPEC.md`](docs/SCENARIO_GUIDANCE_SPEC.md)，新手引導設計請見 [`docs/NEWCOMER_GUIDANCE.md`](docs/NEWCOMER_GUIDANCE.md)。

## 授權與歸屬

內容與程式碼由 Joker 擁有。
