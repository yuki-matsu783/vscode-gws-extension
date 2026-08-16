---
title: 右クリックコンテキストメニューから外部Python APIへリクエストを送るサンプル実装 worklog
type: log
description: issue #4 / plans/zazzy-foraging-meerkat.md の作業ログ
tags: [vscode-extension, context-menu, http-client, sample]
keywords: [contextMenu, fetch, apiBaseUrl, sendFileToApi]
---

# worklog: 右クリックコンテキストメニューから外部Python APIへリクエストを送るサンプル (issue #4)

対応plan: `plans/zazzy-foraging-meerkat.md`

## 2026-08-16

- issue #4 の本文が空だったため、ユーザーに確認し以下を確定:
  - 外部API = README記載のPython API(FastAPI)想定
  - コンテキストメニューはエディタ・エクスプローラー両方
  - リクエスト内容は選択ファイルパスのPOST送信サンプル
  - API URLはVS Code設定(`apiBaseUrl`)で持たせる
- Planを作成・承認。実装に着手。
- `package.json`: `contributes.commands` / `menus`(editor/context, explorer/context) /
  `configuration`(`vscode-gws-extension.apiBaseUrl`, 既定値 `http://localhost:8000`) を追加。
- `src/extension.ts`: `sendFileToApi` コマンドを追加。選択ファイルのワークスペース相対パスを
  `${apiBaseUrl}/analyze` へPOST。5秒タイムアウト、成功/失敗をshowInformationMessage/showErrorMessageで通知。
- `src/test/extension.test.ts`: コマンド登録確認テストを追加。
  - つまずき: `activationEvents: []` のため、`getCommands(true)` を呼ぶだけでは拡張がactivateされず
    自コマンドが一覧に現れずテストが落ちた（`helloWorld` も同様に未検証だったため潜在していた問題）。
    `vscode.extensions.all.find(...).activate()` を明示的に呼んでから確認する形に修正して解消。
- 検証: `npm run compile` / `npm run lint` / `npm test` すべて成功（2 passing）。
  F5でのExtension Development Host起動による目視確認（コンテキストメニュー表示・エラーメッセージ表示)は未実施。
