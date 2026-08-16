---
title: サイドバーにReact Webviewを表示する（サンプル）
type: spec
description: Activity Barの左サイドバーにReact Webviewを表示し、ボタン押下で既存の外部API送信コマンドを呼び出すサンプルの仕様
resource: https://github.com/yuki-matsu783/vscode-gws-extension/issues/6
tags: [vscode-extension, react, webview, sidebar, sample]
keywords: [WebviewViewProvider, viewsContainers, sendFileToApi, postMessage, acquireVsCodeApi, esbuild, CSP, nonce]
---

# サイドバーにReact Webviewを表示する（サンプル）

## 背景・目的

issue #6対応。[README.md](../../README.md)が想定する全体構成のうち、VS Code拡張のUI部分を
React Webviewで構築できることを示すサンプルとして、Activity Barの左サイドバーにReact製の
Webviewを表示する。単なる静的表示に留めず、issue #4で実装した右クリックメニュー→外部Python API
送信（`vscode-gws-extension.sendFileToApi`コマンド）をボタンから呼び出せるようにし、
「Webview UIから拡張ホストの既存機能を呼び出す」という導線もあわせて示す。

技術構成の決定経緯は
[docs/ddr/0004-サイドバーReact-Webviewサンプルの技術構成を決める.md](../ddr/0004-サイドバーReact-Webviewサンプルの技術構成を決める.md)
を参照。

## 仕様

### View定義

- viewContainer: `contributes.viewsContainers.activitybar`に追加。ID
  `vscode-gws-extension-sidebar`（**ドットを含められない制約のためハイフン区切り**。詳細:
  DDR 0004）、タイトル「GWS」、アイコン`media/icon.svg`。
- view: `contributes.views["vscode-gws-extension-sidebar"]`に追加。type `webview`、ID
  `vscode-gws-extension.sidebarView`、名前「GWS」。
- 実装: [src/webview/SidebarViewProvider.ts](../../src/webview/SidebarViewProvider.ts)
  （`vscode.WebviewViewProvider`実装）。`src/extension.ts`の`activate()`内で
  `vscode.window.registerWebviewViewProvider`により登録する。

### Webview UI

- [src/webview/App.tsx](../../src/webview/App.tsx): 「現在のファイルを外部APIへ送信」ボタン1つと、
  直近の送信操作を示す1行のステータス表示（ボタン押下直後に「送信リクエストを送りました
  （結果は通知でご確認ください）」を表示するのみ。送信結果の詳細は表示しない）。
- [src/webview/index.tsx](../../src/webview/index.tsx): `react-dom/client`の`createRoot`で
  `App`をマウントするエントリポイント。
- [src/webview/vscodeApi.ts](../../src/webview/vscodeApi.ts): `acquireVsCodeApi()`
  （1 Webviewインスタンスにつき1回しか呼べない）をモジュールスコープでシングルトン化するラッパー。

### 拡張ホストとのメッセージパッシング

- ボタン押下時、Webview側は`acquireVsCodeApi().postMessage({ type: 'sendFileToApi' })`を送る。
- `SidebarViewProvider.resolveWebviewView`が設定する`webview.onDidReceiveMessage`で受信し、
  `vscode.commands.executeCommand('vscode-gws-extension.sendFileToApi')`を引数なしで実行する。
- `sendFileToApi`コマンドは`uri`未指定時に`vscode.window.activeTextEditor`のドキュメントへ
  フォールバックする実装済みのため（詳細:
  [docs/spec/右クリックで外部APIへリクエストを送信する.md](右クリックで外部APIへリクエストを送信する.md)）、
  「現在アクティブなファイルを外部APIへ送信するボタン」として、fetch等の実処理を新規実装せずに
  機能する。送信結果の通知（成功/エラー）も既存コマンドの
  `showInformationMessage`/`showErrorMessage`をそのまま利用する。

### セキュリティ（CSP）

- `webviewView.webview.options`に`enableScripts: true`と
  `localResourceRoots: [context.extensionUri]`を設定する。
- HTMLの`<script>`はnonceベースのCSP（`Content-Security-Policy: script-src 'nonce-xxx'`）で
  許可し、バンドル済みJS（`out/webview/main.js`）のみ読み込み可能にする。

### ビルド

- Webview（`src/webview/`）はesbuild（[esbuild.js](../../esbuild.js)）で単一ファイル
  `out/webview/main.js`へバンドルする。拡張ホスト側の`tsc -p ./`ビルドは変更しない。
- `npm run compile`は`tsc -p ./`（拡張ホスト） → `tsc --noEmit -p src/webview`
  （Webview型チェックのみ、コード生成はesbuildが担う） → `node esbuild.js`（Webviewバンドル）の
  3段構成。

## 影響範囲

- [package.json](../../package.json): `contributes.viewsContainers`/`views`、
  `dependencies`（`react`, `react-dom`）、`devDependencies`（`esbuild`, `@types/react`,
  `@types/react-dom`等）、`scripts.compile`/`scripts.watch:webview`を追加。
- [src/extension.ts](../../src/extension.ts): `activate()`に
  `registerWebviewViewProvider`の登録を追加。既存の`helloWorld`/`sendFileToApi`コマンドは
  変更しない。
- [src/webview/](../../src/webview/): 新設（本仕様の実装本体）。
- [tsconfig.json](../../tsconfig.json): `exclude`に`src/webview`を追加。
- [eslint.config.mjs](../../eslint.config.mjs): 対象`files`に`**/*.tsx`を追加。
- [media/icon.svg](../../media/icon.svg): 新規（Activity Barアイコン）。
- [src/test/extension.test.ts](../../src/test/extension.test.ts): view定義
  （`contributes.views["vscode-gws-extension-sidebar"]`にIDが含まれること）の静的チェックテストを
  追加。

## 設定項目

新規の設定項目は無し（issue #4で追加済みの`vscode-gws-extension.apiBaseUrl`を、既存の
`sendFileToApi`コマンド経由でそのまま利用する）。

## 未決定事項・懸念点

- **Webview内での送信結果の表示は簡易**: ボタン押下直後の固定メッセージのみで、実際の
  成功/失敗・レスポンス内容はVS Codeの通知（`showInformationMessage`/`showErrorMessage`）に
  委ねている。Webview内に結果ログを表示する等の拡張は今後の課題。
- **`src/extension.ts`のディレクトリ分割は未実施**: 現状1ファイルで十分小さいため
  `src/extension/`への分割は見送った（詳細: DDR 0004、
  [.claude/rules/directory-structure.md](../../.claude/rules/directory-structure.md)）。
  拡張ホスト側のファイルが増えてきた場合に改めて検討する。
- **Webview内部のReact描画・操作の自動テストは対象外**: `@vscode/test-cli`によるExtension
  Development Hostテストではview定義の静的チェックのみ行い、実際の見た目・ボタン操作は
  F5での目視確認に委ねている（issue #4の方針を踏襲。詳細:
  [.claude/rules/vscode-extension-style.md](../../.claude/rules/vscode-extension-style.md)
  「テスト」節）。
