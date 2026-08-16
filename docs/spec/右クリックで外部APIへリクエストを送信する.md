---
title: 右クリックで外部APIへリクエストを送信する（サンプル）
type: spec
description: エディタ/エクスプローラーの右クリックメニューから、選択ファイルのパスをローカルPython API(FastAPI)へPOST送信するサンプルコマンドの仕様
resource: https://github.com/yuki-matsu783/vscode-gws-extension/issues/4
tags: [vscode-extension, context-menu, http-client, sample]
keywords: [sendFileToApi, editor/context, explorer/context, apiBaseUrl, fetch, POST, analyze, タイムアウト]
---

# 右クリックで外部APIへリクエストを送信する（サンプル）

## 背景・目的

[README.md](../../README.md) が想定する全体構成（VS Code拡張 ↔ HTTP ↔ ローカルPython API(FastAPI) ↔
Playwright ↔ Chrome ↔ NotebookLM）のうち、「拡張側からローカルPython APIへHTTPリクエストを送る」
という最小限の通信経路を、右クリックコンテキストメニューを起点としたサンプルとして実装する
（issue #4）。Python API本体の実装・起動連携・NotebookLM連携は別リポジトリ／別issueのスコープであり、
本仕様は拡張側の「送信する」部分のみを対象とする。

## 仕様

### コマンド・メニュー

- コマンドID: `vscode-gws-extension.sendFileToApi`
- タイトル: 「GWS: 選択ファイルを外部APIに送信（サンプル）」
- 表示箇所: エディタの右クリックメニュー（`editor/context`）およびエクスプローラーの右クリック
  メニュー（`explorer/context`）の両方。いずれも `resourceScheme == file` の場合のみ表示する。
- 実装: [src/extension.ts](../../src/extension.ts) の `sendFileToApi` 関数。`activate()` 内で
  `vscode.commands.registerCommand` により登録する。

### 対象ファイルの決定

- エクスプローラーからの呼び出しでは、選択ファイルのURI（`uri`引数）を使う。
- エディタからの呼び出しでは、対象ドキュメントのURI（`uri`引数）を使う。`uri`が渡らない場合
  （コマンドパレット経由等）は `vscode.window.activeTextEditor` のドキュメントURIにフォールバックし、
  それも無ければ警告メッセージを表示して終了する。
- エクスプローラーで複数ファイルを選択した場合（`uris`引数が2件以上）、**サンプル実装の制約として
  先頭の1件のみ送信**し、情報メッセージでその旨を通知する。

### リクエスト内容

- 対象ファイルは `vscode.workspace.asRelativePath()` でワークスペース相対パスに変換する。
- 送信先: `${apiBaseUrl}/analyze`（`apiBaseUrl`は下記「設定項目」参照）
- メソッド: `POST`、ヘッダ `Content-Type: application/json`
- ボディ: `{ "path": "<相対パス>" }`
- HTTPクライアント: 追加ライブラリは導入せず、Node.js/TypeScript標準のグローバル `fetch` を使用する
  （`tsconfig.json` の `lib: ES2022` + `@types/node@24.x` で型定義込みで利用可能なため、
  axios等の新規依存は不要と判断）。
- タイムアウト: `AbortController` により5秒でリクエストを中断する。

### レスポンス・エラー処理

- 成功時（`res.ok`）: レスポンスボディを `res.json()` で取得し、失敗時は `res.text()` に
  フォールバックする。先頭200文字程度に切り詰めて `vscode.window.showInformationMessage` で
  表示する。
- 非2xxレスポンス時: `vscode.window.showErrorMessage` でHTTPステータスと、Python APIが
  起動しているか確認するよう促す文言を表示する。
- タイムアウト・接続エラー時: 同様に `vscode.window.showErrorMessage` でエラー内容（タイムアウト or
  エラーメッセージ）を表示する。

## 影響範囲

- [package.json](../../package.json): `contributes.commands` / `contributes.menus`
  （`editor/context`, `explorer/context`） / `contributes.configuration`
  （`vscode-gws-extension.apiBaseUrl`）を追加。
- [src/extension.ts](../../src/extension.ts): `sendFileToApi` コマンドの実装を追加。既存の
  `helloWorld` コマンドはそのまま維持。
- [src/test/extension.test.ts](../../src/test/extension.test.ts): 両コマンドが
  `vscode.commands.getCommands(true)` に含まれることを確認する単体テストを追加。

## 設定項目

| 設定キー | 型 | 既定値 | 説明 |
|---|---|---|---|
| `vscode-gws-extension.apiBaseUrl` | string | `http://localhost:8000` | ローカルPython API(FastAPI)のベースURL。将来的にAPI起動時の動的ポート通知（README.md想定）と連携する場合は、この設定値を実行時に上書きする形が候補になる。 |

## 未決定事項・懸念点

- **Python API側のエンドポイント契約は仮決め**: `POST /analyze`, body `{ "path": string }` という
  形式は本リポジトリ側で暫定的に定めたものであり、Python API実装リポジトリ側との正式なすり合わせは
  未実施（issue #4時点）。エンドポイント名・レスポンス形式は今後変わる可能性がある。
- **Python API起動連携は対象外**: README.mdが想定する「拡張activate時にPython APIを自動起動し、
  動的ポートを通知する」仕組みは本サンプルには含まれない。ユーザーが別途Python APIを起動しておく
  前提。別issueで対応する。
- **複数ファイル選択時の一括送信は未対応**: 現状は先頭の1件のみを送信するサンプル実装に留まる。
  NotebookLM連携（README.md 13節）で必要になる複数ファイルの一括送信は今後の拡張課題。
- **テストはコマンド登録の確認のみ**: 実際のfetch成功/失敗（Python API実体との疎通）はCI環境に
  Python APIが存在しないため自動テスト対象外とした。F5でのExtension Development Host起動による
  目視確認で代替する。
