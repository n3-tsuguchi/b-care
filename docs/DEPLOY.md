# B-Care デプロイ手順

## 環境構成

| 環境 | Vercel | Supabase | ダミーデータ |
|------|--------|----------|-------------|
| 本番 (Production) | main ブランチ | 本番プロジェクト | なし |
| テスト (Preview) | main 以外のブランチ | テスト用プロジェクト | あり |

---

## 1. Supabase セットアップ

### 本番・テスト共通

各Supabaseプロジェクトで以下を実行:

1. Supabase Dashboard > **SQL Editor** を開く
2. マイグレーションファイルを **番号順に** 実行:
   - `supabase/migrations/00001_create_tables.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00003_views.sql`
   - `supabase/migrations/00004_auth_trigger.sql`
   - `supabase/migrations/00005_phase2_support.sql`
   - `supabase/migrations/00006_fix_phase2_rls.sql`（既存ポリシー削除）
   - `supabase/migrations/00007_phase2_rls_create.sql`（新ポリシー作成）

3. Dashboard > **Settings > API** から以下をメモ:
   - Project URL
   - anon public key
   - service_role key (secret)

### テスト環境のみ: ダミーデータ投入

1. アプリにアクセスしてサインアップ（組織・事業所が自動作成される）
2. `.env.local` にテスト用Supabaseの値を設定
3. ダミーデータ投入:
   ```bash
   npx tsx scripts/seed-dummy.ts
   ```

---

## 2. Vercel デプロイ

### 初回セットアップ

1. [vercel.com](https://vercel.com) にログイン
2. **Add New > Project** をクリック
3. GitHubリポジトリ `b-care` を選択
4. **Framework Preset**: Next.js（自動検出）
5. **Environment Variables** を設定（下記参照）
6. **Deploy** をクリック

### 環境変数の設定

Vercel Dashboard > Project > **Settings > Environment Variables**

#### 本番用 (Production にチェック)
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | 本番SupabaseのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番のanon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 本番のservice role key |

#### テスト用 (Preview にチェック)
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | テストSupabaseのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | テストのanon key |
| `SUPABASE_SERVICE_ROLE_KEY` | テストのservice role key |

### デプロイの仕組み

- `main` ブランチへのpush → **本番環境**に自動デプロイ
- その他のブランチへのpush → **テスト環境（Preview）**に自動デプロイ
- Preview URLは `b-care-xxx-yyy.vercel.app` の形式で自動生成

---

## 3. カスタムドメイン（任意・後から追加可能）

1. Vercel Dashboard > Project > **Settings > Domains**
2. ドメインを入力して **Add**
3. 表示されるDNSレコードをドメイン管理画面で設定
4. SSL証明書は自動発行

---

## 4. 運用時の注意

- **マイグレーション追加時**: 本番・テスト両方のSupabase SQL Editorで実行
- **環境変数追加時**: Vercelの環境変数設定で Production / Preview それぞれに設定
- **ダミーデータリセット**: テスト環境で `npx tsx scripts/seed-dummy.ts` を再実行
