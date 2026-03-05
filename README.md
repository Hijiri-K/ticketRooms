# Rooms - イベント&チケット LINE ミニアプリ

QRコード / URLからLINEミニアプリを起動し、イベントの閲覧・チケット購入ができるWebアプリケーション。

## 主な機能

- QRコード / URL で LINE ミニアプリを起動
- LINE公式アカウントへの自動友だち追加
- LINEアカウントを利用した会員登録 (生年月日・性別・都道府県)
- イベント一覧・詳細の閲覧
- Stripe によるチケット決済
- マイチケット一覧 & QRコード表示
- 購入完了時の LINE プッシュ通知

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| DB | PostgreSQL + Prisma 7 (ドライバーアダプター) |
| 決済 | Stripe (PaymentIntent + Webhook) |
| LINE連携 | LINE ミニアプリチャネル + @line/liff (LIFF SDK) + @line/bot-sdk |
| スタイル | Tailwind CSS 4 |
| インフラ | Docker Compose |
| デプロイ | Vercel (予定) |

## 開発環境セットアップ

### 前提条件

- Docker / Docker Compose
- LINE Developers アカウント
- Stripe アカウント (テストモード)

### 1. LINE ミニアプリチャネルの作成

1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. プロバイダーを選択（または作成）
3. **「LINE ミニアプリ」チャネル** を新規作成
   - ※ 従来の「LINE Login チャネル + LIFF」ではなく、LINE ミニアプリチャネルを使用
   - チャネル作成時に LIFF アプリが自動で1つ作成される（未認証ミニアプリとして審査不要で公開可能）
4. 以下の情報を控える:
   - **LIFF ID** (「ウェブアプリ設定」タブ → LIFF アプリの LIFF ID)
   - **チャネル ID** (「チャネル基本設定」タブ)
   - **チャネルシークレット** (「チャネル基本設定」タブ)
   - **チャネルアクセストークン（長期）** (「Messaging API」タブで発行)
5. 「ウェブアプリ設定」タブ → LIFF アプリの **エンドポイント URL** を設定
   - 開発時: ngrok の URL (`https://xxxx.ngrok-free.app`)
   - 本番: デプロイ先の URL
6. Scope に `profile` と `openid` を設定

### 2. Stripe アカウント設定

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン（テストモード）
2. **公開可能キー** (`pk_test_...`) と **シークレットキー** (`sk_test_...`) を控える

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して控えた値を入力:

```env
DATABASE_URL="postgresql://rooms:rooms_password@db:5432/rooms"

# LINE ミニアプリチャネル
NEXT_PUBLIC_LIFF_ID="ここに LIFF ID"
LINE_CHANNEL_ID="ここにチャネル ID"
LINE_CHANNEL_SECRET="ここにチャネルシークレット"
LINE_CHANNEL_ACCESS_TOKEN="ここにチャネルアクセストークン"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Docker で起動

```bash
docker compose up --build
```

### 5. DB マイグレーション & シードデータ投入

```bash
docker compose exec app npx prisma migrate dev --name init
docker compose exec app npx prisma generate
docker compose exec app npx prisma db seed
```

### 6. ローカルで LINE ミニアプリを動作確認

LINE ミニアプリは LINE のアプリ内ブラウザで動作するため、localhost では動作確認できません。
ngrok でトンネリングして確認します:

```bash
ngrok http 3000
```

1. 発行された `https://xxxx.ngrok-free.app` を LINE Developers Console の LIFF エンドポイント URL に設定
2. LINE アプリから `https://liff.line.me/{LIFF_ID}` を開く

### Stripe Webhook のローカルテスト

```bash
# stripe-cli プロファイルを使う場合
docker compose --profile stripe up

# または手動で
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

テストカード: `4242 4242 4242 4242`

## プロジェクト構成

```
rooms/
├── docker-compose.yml          # Docker Compose (app + db + stripe-cli)
├── Dockerfile                  # Node 22 Alpine
├── prisma/
│   ├── schema.prisma           # DB スキーマ (User, Event, Ticket, Payment)
│   └── seed.ts                 # サンプルイベントデータ
├── prisma.config.ts            # Prisma 7 設定
├── src/
│   ├── app/
│   │   ├── page.tsx            # LIFF 初期化 → ログイン → リダイレクト
│   │   ├── register/           # 会員登録 (アンケート)
│   │   ├── events/             # イベント一覧・詳細・チェックアウト
│   │   ├── tickets/            # マイチケット一覧・詳細 (QR表示)
│   │   └── api/
│   │       ├── auth/line/      # LIFF トークン検証 & ユーザー作成
│   │       ├── users/          # 会員登録・プロフィール取得
│   │       ├── events/         # イベント一覧・詳細 API
│   │       ├── tickets/        # チケット一覧・詳細 API
│   │       ├── payments/       # Stripe PaymentIntent 作成
│   │       └── webhooks/       # Stripe & LINE Webhook
│   ├── components/
│   │   ├── liff-provider.tsx   # LIFF SDK Context Provider
│   │   ├── bottom-nav.tsx      # ボトムナビゲーション
│   │   ├── event-card.tsx      # イベントカード
│   │   ├── checkout-form.tsx   # Stripe Elements 決済フォーム
│   │   └── qr-code-display.tsx # QR コード表示
│   └── lib/
│       ├── prisma.ts           # Prisma シングルトン (ドライバーアダプター)
│       ├── auth.ts             # LIFF トークン検証 & 認証ヘルパー
│       ├── stripe.ts           # Stripe サーバー側クライアント
│       ├── stripe-client.ts    # Stripe クライアント側 (loadStripe)
│       └── line-messaging.ts   # LINE Messaging API クライアント
```

## DB スキーマ

4つのモデル: **User**, **Event**, **Ticket**, **Payment**

- `User` - LINE ユーザーID をキーに、アンケート情報 (生年月日・性別・都道府県) を保持
- `Event` - イベント情報 (タイトル・日時・会場・価格・定員・販売数)
- `Ticket` - ユーザーとイベントを紐付け、入場用 QR コード (UUID) を保持
- `Payment` - Stripe PaymentIntent と紐付いた決済記録 (Ticket と 1:1)

## 主要フロー

### LINE ミニアプリ起動 → 会員登録

1. `https://liff.line.me/{liffId}` をQRコード/URLで開く
2. `liff.init()` → LINE ログイン (権限許可は段階的に表示)
3. `/api/auth/line` でトークン検証 & ユーザー作成
4. 未登録なら `/register` へ、登録済みなら `/events` へ

### チケット購入

1. イベント詳細 → 「チケットを購入」
2. `/api/payments/create-intent` で Ticket + Payment 作成 & PaymentIntent 発行
3. Stripe Elements で決済
4. Stripe Webhook (`payment_intent.succeeded`) で Payment ステータス更新 & LINE 通知

## LINE ミニアプリ vs 認証済みミニアプリ

本アプリは **未認証ミニアプリ** として審査不要で公開可能です。
認証済みミニアプリに昇格すると以下の機能が追加されます:

- サービスメッセージの送信
- チャネル同意スキップ
- ホーム画面ショートカット追加
- LINE ミニアプリ専用タブへの掲載

## 本番デプロイ (Vercel)

1. Vercel にプロジェクトをインポート
2. 環境変数を設定 (`DATABASE_URL` は外部 PostgreSQL: Neon, Supabase 等)
3. LIFF エンドポイント URL を本番 URL に更新
4. Stripe Webhook エンドポイントを `https://your-domain.com/api/webhooks/stripe` に設定
