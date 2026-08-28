# 班編成＆席替えジェネレーター（スタンドアロン版）

先生専用のゼロ設定（生徒情報一括登録・ペア制限・位置希望）をもとに、班編成と席替え（市松模様・フリック空席調整・自動生成）を行う、**サーバー不要・API キー不要**の完全ブラウザ完結型アプリです。

- `index.html` … 本体アプリ（React 製フル機能版を1ファイルに単一化したもの。GitHub Pagesではこれがトップページとして表示されます）
- `sekigae_full_app.html` … `index.html` と同一内容（アプリ内の「完全版HTMLダウンロード」ボタンが参照しているファイルなので、公開時も一緒に置いておくとそのボタンが機能します）

いずれもダブルクリックしてブラウザで開くだけで動作します。入力データはブラウザの `localStorage` に保存されます（サーバーには送信されません／端末・ブラウザごとに保存されるためデータは共有されません）。

## GitHub Pages で公開する手順

### 方法A：GitHub のWeb画面だけで完結（Gitコマンド不要）

1. GitHub にログインし、右上の「+」→「New repository」で新しいリポジトリを作成します（例: `sekigae-app`）。Public（公開）を選択してください。
2. 作成したリポジトリのページで「Add file」→「Upload files」をクリックし、このフォルダの中身（`index.html` など）をすべてドラッグ＆ドロップしてアップロード、「Commit changes」をクリックします。
3. リポジトリの「Settings」タブ →左メニューの「Pages」を開きます。
4. 「Build and deployment」の「Source」を **Deploy from a branch** に設定し、「Branch」を `main` ／ フォルダを `/ (root)` にして「Save」をクリックします。
5. 1分ほど待つと、ページ上部に公開URL（`https://<あなたのユーザー名>.github.io/<リポジトリ名>/`）が表示されるのでアクセスして動作を確認してください。

### 方法B：git コマンドを使う場合

```bash
cd publish   # このフォルダに移動
git init
git add .
git commit -m "Add standalone seating app"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git push -u origin main
```

その後、方法Aの手順3〜5と同様に GitHub の「Settings」→「Pages」で公開設定を行ってください。

## 補足

- フォントは Google Fonts（Inter / Noto Sans JP 等）をオンラインから読み込みます。GitHub Pages 上で開く場合はネットワークがあるため問題なく表示されますが、オフラインで `index.html` を直接開いた場合は代替フォントで表示されます（機能には影響ありません）。
- このファイルをコピーして配布・共有すれば、生徒用PCやタブレットでもそのまま動作します。
