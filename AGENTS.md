# AGENTS.md

## プロジェクト概要

「じかん帳」は、日本語ユーザー向けの個人用時間記録アプリです。活動の登録、タイマー、手動の時間記録、日・週・月単位の集計、週間目標、Google ログインを提供します。

データアクセスは必ず次の経路を通します。

```text
React → Hono API → Drizzle ORM → Cloudflare D1
```

フロントエンドから D1 を直接操作しないでください。

## 技術スタックと実行環境

- Node.js 20 以上、pnpm
- React + Vite + TypeScript
- Tailwind CSS（`@tailwindcss/vite`）と独自の共有 UI コンポーネント
- React Router、Recharts、date-fns / date-fns-tz、Lucide
- Hono on Cloudflare Workers
- Cloudflare D1 + Drizzle ORM / Drizzle Kit
- Better Auth + Google OAuth
- Cloudflare Workers Static Assets（SPA fallback）

`vite.config.ts` の Cloudflare Vite plugin が、Worker と SPA の asset をまとめて扱います。Worker のエントリポイントは `src/server/index.ts`、D1 binding は `DB`、静的 asset binding は `ASSETS` です。

## ディレクトリ構成

```text
src/
  client/                  React アプリ
    components/            共有 UI と活動選択 UI
    lib/                   API、日時、表示用ヘルパー
    pages/                 画面単位のコンポーネント
    App.tsx                認証状態とルーティング
  server/
    index.ts               Hono の API ルートと認証 middleware
    auth/auth.ts           リクエスト単位の Better Auth 設定
    db/schema.ts           アプリケーションテーブル
    db/auth-schema.ts      Better Auth CLI 生成の schema
    services/time.ts       JST の日時変換と期間集計境界
  shared/
    schemas.ts             API 入力の Zod schema
    types.ts               client/server 共通 DTO
drizzle/                   D1 migration と Drizzle のメタデータ
auth.ts                    Better Auth schema 生成 CLI 用の設定
wrangler.jsonc             Worker、D1、asset の Cloudflare 設定
```

## よく使うコマンド

```bash
pnpm install
pnpm dev                  # http://localhost:5173
pnpm typecheck            # client/server の TypeScript 検査
pnpm test                 # Vitest を一度実行
pnpm test:watch           # Vitest watch
pnpm build                # 本番 build
pnpm preview              # build 済み asset の確認
pnpm deploy               # build 後に wrangler deploy
```

DB や認証 schema を変更する場合は次を使います。

```bash
pnpm auth:generate        # Better Auth schema を再生成する場合のみ
pnpm db:generate          # schema から drizzle migration を生成
pnpm db:migrate:local     # ローカル D1 に適用
pnpm db:migrate:remote    # 本番 D1 に適用
```

現状、lint/format 用の package script はありません。既存コードのスタイルに合わせ、不要な formatter や依存関係を導入しないでください。

## ローカル環境と秘密情報

`.dev.vars.example` を `.dev.vars` にコピーして、Better Auth の secret、Google OAuth の client ID/secret、必要に応じて開発者 preview の値を設定します。`.dev.vars` は Git にコミットしません。

必要な変数は次のとおりです。

- `BETTER_AUTH_SECRET`: 32 文字以上のランダムな秘密値
- `BETTER_AUTH_URL`: ローカルでは `http://localhost:5173`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `APP_ENV` と `DEV_PREVIEW_ENABLED`: `/preview` をテスト環境で有効にする場合のみ

本番の値は `wrangler secret put` で登録します。secret、OAuth credential、D1 database ID をソースコード、`wrangler.jsonc`、クライアント bundle に書かないでください。

## 認証とデータ所有権

- `/api/auth/*` は Better Auth の handler に渡します。
- `/api/dev-preview` と `/api/health` 以外のアプリ API は `authRequired` middleware で保護します。
- ユーザー ID は body、query、path から受け取らず、Better Auth session から取得します。
- 活動、記録、目標の SELECT/UPDATE/DELETE 条件には必ず session の user ID を含めます。
- 別ユーザーの ID を指定したときに、その存在を推測できる情報を返さないようにします。
- 新しい保護 API を追加するときも、ルートに `authRequired`、入力 JSON に Zod validator、所有者条件を必ず追加します。

Better Auth の実行時設定は `src/server/auth/auth.ts` にあります。ルートの `auth.ts` は schema 生成 CLI が設定を発見するためのファイルであり、実行時の認証設定を変更する場所ではありません。

## API の規約

成功レスポンスは `{ data: ... }`、エラーは `{ error: { code, message } }` です。サーバーでは `ok` / `fail` helper を使い、クライアントでは `apiRequest` を使ってください。

現在の API は次の領域に分かれています。

- `/api/activities`: 活動の一覧・作成・更新・削除
- `/api/timer/current`, `/api/timer/start`, `/api/timer/stop`: 実行中タイマー
- `/api/time-entries`: 手動記録を含む時間記録の一覧・作成・更新・削除
- `/api/reports/day|week|month`: 集計とグラフ用 DTO
- `/api/goals`: 週間目標の一覧・作成・更新・削除
- `/api/auth/*`: Better Auth

入力形式を変更するときは、`src/shared/schemas.ts` と `src/shared/types.ts` を先に更新し、server と client の両方を確認します。新しいエラーは既存の HTTP status/code の方針に合わせます。

## 時刻と集計のルール

- DB には Unix timestamp の秒を UTC 基準で保存します。
- 入力と表示、日・週・月の境界は `Asia/Tokyo`（JST）です。
- 週の開始日は月曜日です。
- server の変換・境界計算は `src/server/services/time.ts`、client の表示は `src/client/lib/dates.ts` の helper を再利用します。
- 集計は記録と期間の重なりを `overlapSeconds` で切り出します。期間境界や日跨ぎを変更するときは既存の time test を拡張してください。
- 実行中の時間記録は `endedAt` と `durationSeconds` が null です。D1 の partial unique index により、ユーザーごとに実行中タイマーは最大 1 件です。

## DB と migration

アプリ schema は `src/server/db/schema.ts`、Better Auth schema は `src/server/db/auth-schema.ts` です。`drizzle.config.ts` が両方を読み込みます。

- migration は `drizzle/` に生成し、SQL と Drizzle metadata を Git 管理します。
- 本番 Worker 起動時の自動 migration はありません。デプロイ前に対象 D1 へ migration を明示的に適用します。
- Better Auth の schema を手編集しないでください。認証設定を変更した場合は `pnpm auth:generate`、続けて `pnpm db:generate` を実行して差分を確認します。
- 活動削除時は、その活動の目標と時間記録も削除する現在の挙動を維持します。
- `worker-configuration.d.ts` は Wrangler が生成するファイルなので手編集しません。

## フロントエンドの変更方針

ルートは `src/client/App.tsx` に集約されています。ログイン済み画面は `Layout` 配下、`/preview` は認証不要の開発者 preview です。ただし preview の API は `APP_ENV=test` かつ `DEV_PREVIEW_ENABLED=true` の場合だけ有効で、データを D1 に保存しません。

API 通信は `credentials: "include"` で session cookie を送る `src/client/lib/api.ts` を経由します。API の直接 `fetch`、認証情報の localStorage 保存、D1 binding の client への公開は避けてください。

既存の見た目は Tailwind utility と `src/client/components/ui.tsx` の `Button`、`Card`、`Input`、`Select`、`Progress`、`PageTitle`、`Empty` を中心に構成されています。新しい画面ではこれらを優先して再利用し、共有 UI の変更が複数画面に影響することを確認します。

## テストと変更時の確認

最低限、変更後に次を実行します。

```bash
pnpm typecheck
pnpm test
pnpm build
```

特に次を確認してください。

- 認証なしでは保護 API が 401 になる
- 他ユーザーの活動・記録・目標を読んだり変更したりできない
- JST の日付境界、月跨ぎ・週跨ぎ、日跨ぎの集計が壊れていない
- 実行中タイマーを二重起動できない
- API の response envelope と DTO が client の期待と一致している
- schema 変更時に migration が生成され、local/remote の適用手順が明確である

既存テストは `src/server/services/time.test.ts`（JST と集計境界）と `src/client/lib/api.test.ts`（時間表示）です。API の認証・所有者境界や D1 を変更した場合は、可能なら Worker/D1 の統合テストも追加してください。
