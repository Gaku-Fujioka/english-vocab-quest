# Supabase設定・操作手順

このアプリでは、Supabaseを次の用途で使用します。

- メールアドレスとパスワードによるログイン
- ユーザーごとの学習データの保存
- 複数端末間での学習データ同期

## 1. 使用するSupabaseプロジェクト

以前作成したSupabaseプロジェクトをそのまま使用できます。新しいプロジェクトを作る必要はありません。

次の条件を満たしていることだけ確認してください。

- `.env.local` のURLとキーが、使用するSupabaseプロジェクトのものになっている
- Supabase上でプロジェクトが停止・削除されていない
- キーを再生成した場合は、`.env.local` も新しい値へ更新している

## 2. 環境変数

プロジェクト直下の `.env.local` に次の2項目を設定します。

```text
VITE_SUPABASE_URL=SupabaseのProject URL
VITE_SUPABASE_ANON_KEY=SupabaseのAnon KeyまたはPublishable Key
```

値はSupabaseダッシュボードのプロジェクト設定から確認できます。

注意事項：

- 既に正しい値が設定されている場合は変更不要です
- `service_role` キーは絶対に設定しないでください
- `.env.local` はGitへコミットしないでください
- `.env.local` を変更した場合は、開発サーバーを再起動してください

## 3. データベースを設定する

学習データ保存用のテーブルと、ユーザー本人だけがデータを操作できるRLSポリシーを作成します。

1. Supabaseダッシュボードで既存プロジェクトを開く
2. 左メニューから「SQL Editor」を開く
3. 「New query」を押す
4. [`supabase/migrations/202607030001_create_app_snapshots.sql`](../supabase/migrations/202607030001_create_app_snapshots.sql) の内容をすべてコピーする
5. SQL Editorへ貼り付ける
6. 「Run」を押す
7. エラーが表示されず完了することを確認する

このSQLは次の設定を行います。

- `app_snapshots` テーブルを作成
- ユーザー1人につき1件の学習データを保存
- Row Level Security（RLS）を有効化
- ログイン中の本人だけが自分の行を読み書きできるように制限

既に `app_snapshots` テーブルがある場合でも、同じ構造であればテーブルは再作成されません。RLSポリシーはこのアプリ用の内容へ更新されます。

## 4. テーブルとRLSを確認する

SQL実行後、Supabaseダッシュボードで次を確認します。

1. 「Table Editor」を開く
2. `app_snapshots` テーブルが存在することを確認する
3. カラムが次の構成になっていることを確認する

| カラム | 用途 |
| --- | --- |
| `user_id` | Supabase AuthのユーザーID |
| `data` | 学習状態・学習記録・設定 |
| `updated_at` | 最終保存日時 |

続いて、`app_snapshots` のRLSが有効になっていることを確認してください。

ポリシー名は次のとおりです。

```text
Users can manage their own app snapshot
```

## 5. メール認証を確認する

1. Supabaseダッシュボードで「Authentication」を開く
2. 「Providers」を開く
3. Emailプロバイダーが有効になっていることを確認する

メール確認を有効にしている場合、新規登録後に届く確認メールのリンクを開いてからログインします。

開発中に確認メールを省略したい場合は、Supabase側のメール確認設定を変更できます。ただし、一般公開する場合はメール確認を有効にすることを推奨します。

## 6. アプリを起動する

```powershell
npm run dev
```

起動後はログイン画面が表示されます。

初めて使用する場合：

1. 「初めての方はこちら」を押す
2. メールアドレスとパスワードを入力する
3. 「アカウントを作成する」を押す
4. 必要に応じて確認メールを開く
5. ログインする

## 7. データ移行と同期の動作

以前ログインなしで学習していたデータが同じブラウザに残っている場合、最初にログインしたユーザーへ一度だけ引き継がれます。

ログイン後の保存方法は次のとおりです。

- 回答や設定変更は、ユーザーID別のLocalStorageへすぐ保存
- 変更後、Supabaseへ自動同期
- 同じ端末ではLocalStorageのデータを優先
- 新しい端末ではSupabaseのデータを取得
- ログアウトするとログイン画面へ戻る
- 別ユーザーでログインしてもLocalStorageのデータは混ざらない

## 8. 手動確認

次の順番で確認してください。

1. 新規登録またはログインができる
2. 単語を数問学習する
3. ページを再読み込みしてもログイン状態と進捗が残る
4. 学習を中断し、再読み込み後に続きから再開できる
5. 設定画面にログイン中のメールアドレスが表示される
6. 設定画面からログアウトするとログイン画面へ戻る
7. 再ログインすると以前の進捗が表示される
8. Supabaseの `app_snapshots` にログインユーザーの行が1件作成される

## 9. 公開前にテストデータを全削除する

公開前にテストユーザーと学習データを削除し、全員が新規登録から始める状態にできます。

この操作では、次のものは削除しません。

- `app_snapshots` テーブル
- RLSポリシー
- Auth設定
- 固定語彙CSV
- アプリのソースコード

削除するのは次のデータだけです。

- テスト用のAuthユーザー
- テストユーザーに紐付くクラウド学習データ
- 開発ブラウザに残っているログイン情報とLocalStorageの学習データ

### 手順1：開発サーバーを停止する

自動同期が動かないように、起動中の `npm run dev` を `Ctrl + C` で停止します。アプリを開いているブラウザタブも閉じてください。

### 手順2：Supabase Authのテストユーザーを削除する

1. Supabaseダッシュボードで対象プロジェクトを開く
2. 「Authentication」を開く
3. 「Users」を開く
4. テスト用ユーザーを選択する
5. 「Delete user」を実行する
6. 公開前に削除したいすべてのテストユーザーで繰り返す

`app_snapshots.user_id` には `ON DELETE CASCADE` が設定されています。そのため、Authユーザーを削除すると、そのユーザーの `app_snapshots` データも自動的に削除されます。

プロジェクト自体や `app_snapshots` テーブルは削除しないでください。

### 手順3：クラウドデータが空になったことを確認する

SupabaseのSQL Editorで次のSQLを実行します。

```sql
select count(*) as snapshot_count
from public.app_snapshots;
```

結果が `0` なら、クラウド上の学習データは空です。

もしAuthユーザーをすべて削除したのに行が残っている場合だけ、次のSQLで学習データを削除します。

```sql
delete from public.app_snapshots;
```

### 手順4：ブラウザのLocalStorageを削除する

ChromeまたはEdgeで開発URLを開き、次の操作を行います。

1. 開発者ツールを開く
2. 「Application」を開く
3. 「Storage」または「Local Storage」を開く
4. `http://localhost:5173` のサイトデータを削除する
5. ページを再読み込みする

コンソールから削除する場合は、`http://localhost:5173` を開いた状態で次を実行します。

```js
for (const key of Object.keys(localStorage)) {
  const isAppData = key.startsWith('toeic_vocab_')
  const isSupabaseSession = key.startsWith('sb-') && key.endsWith('-auth-token')

  if (isAppData || isSupabaseSession) {
    localStorage.removeItem(key)
  }
}

location.reload()
```

再読み込み後にログイン画面が表示されれば、ブラウザ側の初期化は完了です。

### 手順5：最終確認

- AuthenticationのUsersにテストユーザーが残っていない
- `app_snapshots` の行数が0
- アプリを開くとログイン画面が表示される
- テーブル、RLS、固定語彙CSVは残っている

以上を確認したら、公開用のデプロイへ進めます。

## 10. よくある問題

### `Supabase is not configured.` と表示される

`.env.local` の変数名と値を確認し、`npm run dev` を再起動してください。

### ログインできない

- メールアドレスとパスワードを確認する
- 確認メールが必要な設定になっていないか確認する
- SupabaseのAuthentication画面でユーザーが作成されているか確認する

### クラウド保存に失敗する

- `app_snapshots` テーブルが存在するか確認する
- RLSが有効になっているか確認する
- このドキュメントのSQLを実行済みか確認する
- `.env.local` が同じSupabaseプロジェクトを参照しているか確認する

### 別のユーザーのデータが見える

通常はRLSとユーザー別LocalStorageにより発生しません。発生した場合は、RLSポリシーが正しく適用されているかを最優先で確認してください。
