---
title: 右クリックコンテキストメニューから外部Python APIへリクエストを送るサンプル実装
type: plan
description: issue #4 向け。エディタ/エクスプローラーの右クリックメニューからローカルPython API(FastAPI)へファイルパスをPOST送信するサンプルコマンドを追加する計画
tags: [vscode-extension, context-menu, http-client, sample]
keywords: [contextMenu, fetch, apiBaseUrl, sendFileToApi, editor/context, explorer/context, package.json, extension.ts]
---

# 右クリックコンテキストメニューから外部Python APIへリクエストを送るサンプル (issue #4)

## Context

issue #4「右クリックのコンテキストメニューを追加し、外部APIに向けてリクエストを送る機能のサンプルを
作成する」に対応する。issue本文が空だったため、ユーザーに確認のうえ以下の前提を確定した。

- 「外部API」= README.md記載の想定構成（VS Code拡張 ↔ HTTP ↔ ローカルPython API(FastAPI)）。
  Python API自体の実装は別リポジトリのスコープ外であり、本タスクは拡張側から見た通信サンプルのみを扱う。
- コンテキストメニューは**エディタ右クリック（editor/context）とエクスプローラー右クリック
  （explorer/context）の両方**に追加する。
- リクエスト内容は「右クリックしたファイルのパスをPOST送信する」サンプル（README 13節の
  「ファイルを選択→右クリック→送る」というUXに最も近い最小サンプル）。
- Python API側のURLは固定値ではなくVS Code設定（`apiBaseUrl`）で持たせる（将来の動的ポート対応・
  API起動連携は別issueのスコープ）。

現状 `src/extension.ts` は `yo code` 生成の雛形のままで、コマンドは `helloWorld` の1つのみ、
`package.json` の `contributes` も `commands` のみで `menus` / `configuration` は未定義。
HTTPクライアントライブラリ（axios等）も未導入だが、`tsconfig.json` の `lib: ES2022` +
`@types/node@24.x` によりグローバル `fetch` が型付きで利用可能なため、新規依存追加は不要。

## 実施内容

### 1. `package.json`

- `contributes.commands` に1件追加:
  `{ "command": "vscode-gws-extension.sendFileToApi", "title": "GWS: 選択ファイルを外部APIに送信（サンプル）" }`
- `contributes.menus` を新設し、`editor/context` と `explorer/context` の両方に上記コマンドを追加。
  誤爆防止のため `"when": "resourceScheme == file"` を付与する。
- `contributes.configuration` を新設し、`vscode-gws-extension.apiBaseUrl`
  （`type: string`, `default: "http://localhost:8000"`, 説明文付き）を追加する。

### 2. `src/extension.ts`

- 既存の `helloWorld` 実装はそのまま残し、新規コマンド `sendFileToApi` を追加する。
- ハンドラ `sendFileToApi(uri?: vscode.Uri, uris?: vscode.Uri[])`:
  - `uri` 未指定時（コマンドパレット経由など）は `vscode.window.activeTextEditor?.document.uri` に
    フォールバックし、それも無ければ警告メッセージを出して終了。
  - `uris`（エクスプローラー複数選択時にVS Codeが渡す配列）が2件以上ある場合は、サンプル実装の
    スコープとして先頭の1件のみを送信し、情報メッセージで「複数選択時は先頭のファイルのみ送信します
    （サンプル実装の制約）」と伝える。
  - `vscode.workspace.asRelativePath(uri)` でワークスペース相対パスを取得（README 13節のファイル
    一覧表現に合わせる）。
  - 設定 `vscode-gws-extension.apiBaseUrl` を `vscode.workspace.getConfiguration(...)` から取得
    （既定値 `http://localhost:8000`）。
  - `${baseUrl}/analyze` へ `fetch` でPOST（`Content-Type: application/json`, body
    `{ "path": "<relativePath>" }`）。`AbortController` で5秒タイムアウトを設定する。
  - 成功時（`res.ok`）: レスポンスボディを取得し（`res.json()`失敗時は`res.text()`にフォールバック）、
    `vscode.window.showInformationMessage` で結果概要（先頭200文字程度）を表示する。
  - 失敗時（タイムアウト／接続エラー／非2xx）: `vscode.window.showErrorMessage` でエラー内容と
    「ローカルでPython APIが起動しているか確認してください」という案内を表示する。
- `activate()` 内で新規 `disposable` を登録し `context.subscriptions` に追加する。

### 3. テスト（`src/test/extension.test.ts`）

- 既存のサンプルテストに加え、`vscode.commands.getCommands(true)` の戻り値に
  `vscode-gws-extension.sendFileToApi` が含まれることを確認する軽量テストを1件追加する
  （既存の `helloWorld` 登録も同様に未検証のため、両コマンドの登録確認として揃える）。
- Python API実体への疎通が必要な統合テスト（実際のfetch成功/失敗）は、CI環境にPython APIが
  存在しないため対象外とする（下記「対象外」参照）。

## 対象外

- Python API側（FastAPI）の実装・起動・エンドポイント契約の正式決定（別リポジトリのスコープ）。
- Python API起動連携（拡張activate時の自動起動、動的ポート通知）は別issueで扱う。
- 複数ファイル選択時の一括送信・進捗表示等のUX強化。
- `docs/spec/` への正式な機能仕様反映（issue-mr-flowの設計反映ステップ・flow-id 16で実施）。

## 検証方法

1. `npm run compile` / `npm run lint` / `npm test` がすべて成功すること。
2. F5でExtension Development Hostを起動し、以下を目視確認する。
   - エディタ上で右クリック → 「GWS: 選択ファイルを外部APIに送信（サンプル）」が表示される。
   - エクスプローラーのファイル上で右クリック → 同項目が表示される。
   - Python APIが起動していない状態でコマンド実行 → エラーメッセージが表示される（タイムアウト or
     接続エラー）ことを確認する。
   - （任意）ローカルで `http://localhost:8000/analyze` にPOSTを受け付けるダミーサーバーを立てて
     実行し、成功時の情報メッセージ表示を確認する。
