# じかん帳

日本人の個人ユーザー向けに、いま取り組んでいる活動の時間を記録し、あとから使った時間を振り返るためのシンプルなWebアプリです。大学、資格勉強、英語、読書、プログラミング、個人開発などを活動として登録できます。

## 技術スタック

- Frontend: React / Vite / TypeScript / Tailwind CSS / shadcn/ui風の共有UIコンポーネント / React Router / Recharts / date-fns
- Backend: Hono / Cloudflare Workers
- Database: Cloudflare D1 / Drizzle ORM / drizzle-kit
- Authentication: Better Auth / Google OAuth
- Hosting: Cloudflare Workers Static Assets

アプリケーションのデータは React から D1 へ直接アクセスせず、React → Hono API → Drizzle → D1 の経路で操作します。Better Authの認証情報も同じD1に保存します。

## セットアップ

必要なものは Node.js 20以上、pnpm、Cloudflareアカウントです。

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm dev
```

ローカルURLは通常 `http://localhost:5173` です。`.dev.vars` はGitへコミットしないでください。

### ログインなしの開発者プレビュー

テスト環境のUIだけ確認したい場合は、`.dev.vars` に次を設定して `http://localhost:5173/preview` を開きます。

```dotenv
APP_ENV="test"
DEV_PREVIEW_ENABLED="true"
```

`/preview` はサンプルデータ専用で、D1への保存や認証は行いません。本番の `wrangler.jsonc` にはこれらの値を設定しないため、Worker API側で404になり利用できません。共有されたテスト環境で使う場合は、環境自体を開発者のみがアクセスできるCloudflare環境にしてください。

## Better AuthとGoogle OAuth

1. Google Cloud ConsoleでOAuthクライアント（Webアプリケーション）を作成します。
2. 承認済みのリダイレクトURIに、次を追加します。
   - ローカル: `http://localhost:5173/api/auth/callback/google`
   - `127.0.0.1` で開く場合: `http://127.0.0.1:5173/api/auth/callback/google`
   - 本番: `https://あなたのドメイン/api/auth/callback/google`
3. 承認済みのJavaScript生成元に、次を追加します。
   - ローカル: `http://localhost:5173`
   - `127.0.0.1` で開く場合: `http://127.0.0.1:5173`
   - 本番: `https://あなたのドメイン`
4. `.dev.vars` に次を設定します。

```dotenv
BETTER_AUTH_SECRET="32文字以上のランダムな秘密値"
BETTER_AUTH_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

OAuth開始後は、`localhost` と `127.0.0.1` を切り替えないでください。これらはブラウザ上で別のCookie保存先として扱われます。

Better Authのschemaは公式CLIで生成した `src/server/db/auth-schema.ts` を使用しています。認証設定を変えた場合は、次のコマンドで再生成し、Drizzle migrationを作り直して確認してください。

```bash
pnpm auth:generate
pnpm db:generate
```

実行時は `src/server/auth/auth.ts` でリクエストごとのCloudflare D1 bindingをBetter Auth公式Drizzle adapterへ渡します。Better AuthのsecretやGoogle secretはソースコードや `wrangler.jsonc` に書きません。

## Cloudflare設定

```bash
wrangler login
wrangler d1 create jikan-cho-db
```

`wrangler d1 create` の結果に表示されたdatabase IDを `wrangler.jsonc` の `database_id` に設定します。binding名は `DB` です。Vite pluginがWorkerとSPAのstatic assetsを一緒にbuild/deployします。

本番Secretsは次で登録します。

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

## D1とmigration

`src/server/db/schema.ts`（アプリテーブル）と、Better Auth公式CLI生成の `src/server/db/auth-schema.ts` をDrizzle Kitが読み込みます。最初のmigrationには次のテーブルが含まれます。

- `user`, `session`, `account`, `verification`: Better Auth公式schema
- `activities`: ユーザーの活動
- `time_entries`: タイマー／手動記録。`user_id`ごとに終了していないレコードを1件にするpartial unique indexを含む
- `weekly_goals`: `user_id, activity_id` の組み合わせが一意な週間目標

アプリの時刻はUnix timestamp秒でUTC保存し、集計境界と表示は `Asia/Tokyo` です。週は月曜日開始です。

```bash
# schema.tsからmigrationを生成
pnpm db:generate

# ローカルD1へ適用
pnpm db:migrate:local

# 本番D1へ適用（デプロイ前に実行）
pnpm db:migrate:remote
```

本番環境でWorker起動時に自動migrationは行いません。migrationファイルはGit管理し、ローカルD1と本番D1を別々に適用してください。

## 開発・テスト・デプロイ

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm deploy
```

`pnpm deploy` はbuild後に `wrangler deploy` を実行します。デプロイ前に本番D1へmigrationを適用し、Secrets、Google OAuthの本番callback URL、`BETTER_AUTH_URL` を確認してください。

## API概要

- `GET/POST/PATCH/DELETE /api/activities`
- `GET /api/timer/current`, `POST /api/timer/start`, `POST /api/timer/stop`
- `GET/POST/PATCH/DELETE /api/time-entries`
- `GET /api/reports/day`, `/api/reports/week`, `/api/reports/month`
- `GET/POST/PATCH/DELETE /api/goals`
- `GET/POST/... /api/auth/*`: Better Auth

保護APIのユーザーIDはリクエストbodyから受け取らず、共通のBetter Auth session middlewareから取得します。活動・記録・目標の変更条件にも必ず認証済みユーザーIDを含めています。

## MVPの範囲

Googleログイン、活動管理、タイマー、手動入力、今日／今週／今月の振り返り、活動別グラフ、週間目標、スマートフォン向けUIを実装しています。チーム、課金、通知、CSV、オフライン同期などは含めていません。
