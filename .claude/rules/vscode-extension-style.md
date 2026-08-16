---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
title: コーディングルール（TypeScript / VS Code拡張・React Webview）
type: rule
description: vscode-gws-extension本体（拡張ホスト・React Webview）のTypeScript/TSXコーディング規約
tags: [typescript, vscode-extension, react, webview, coding-style]
keywords: [命名規則, activationEvents, WebviewViewProvider, postMessage, viewsContainers, fetch, AbortController, esbuild, acquireVsCodeApi, CSP, nonce]
---

# コーディングルール（TypeScript / VS Code拡張・React Webview）

issue #4（右クリックメニュー→外部API送信サンプル）・issue #6（サイドバーReact Webviewサンプル）の
実装で判明した、再現性のある具体的な規約・注意点をまとめる。`.claude/rules/directory-structure.md`
が定めるディレクトリ構成（`src/extension.ts` = 拡張ホスト、`src/webview/` = React Webview）を前提とする。

## 基本

- インデントは**タブ**（`yo code`/generator-code生成コードのスタイルを踏襲）。ESLintにインデント
  ルールは設定していないため強制はされないが、既存ファイルと揃える。
- 文字列リテラルはシングルクォート、文末セミコロンあり（`eslint.config.mjs`の`semi: "warn"`）。
- 比較は`===`/`!==`を使う（`eslint.config.mjs`の`eqeqeq: "warn"`）。
- コメントは日本語で統一する。
- 対応する設計ドキュメント（`docs/spec/機能名.md`）を持つファイルの冒頭には、そのドキュメントへの
  パスを参照コメントとして入れる（実例: [src/extension.ts](../../src/extension.ts)の
  `API_REQUEST_PATH`付近のコメント）。

## 命名規則

- クラス・Reactコンポーネント: `PascalCase`（例: `SidebarViewProvider`, `App`）
- 関数・変数・ファイル名（コンポーネント以外）: `camelCase`（例: `sendFileToApi.ts`のような
  関数名。ファイル名自体はコンポーネントなら`App.tsx`のようにPascalCase、それ以外は`camelCase`）
- 定数: `UPPER_SNAKE_CASE`（例: `API_REQUEST_PATH`, `API_REQUEST_TIMEOUT_MS`）
- コマンドID・設定キー・view/viewContainer ID: `<拡張のpackage.json name>.<機能名>`のドット区切り
  （例: `vscode-gws-extension.sendFileToApi`, `vscode-gws-extension.apiBaseUrl`）。
  **ただし`contributes.viewsContainers`のIDにはドットを含められない**（後述「VS Code拡張API固有の
  注意点」参照）。

## 拡張ホスト側（`src/extension.ts`等）

- `activate(context)`内で`vscode.commands.registerCommand` / `vscode.window.registerWebviewViewProvider`
  等の登録を行い、返り値（Disposable）はすべて`context.subscriptions.push(...)`にまとめて渡す。
- 右クリックメニュー等から呼ばれるコマンドハンドラは`(uri?: vscode.Uri, uris?: vscode.Uri[])`の
  シグネチャで受け、`uri ?? uris?.[0] ?? vscode.window.activeTextEditor?.document.uri`の順で
  フォールバックするパターンを踏襲する（実装: `src/extension.ts`の`sendFileToApi`）。
- 外部HTTPリクエストは新規ライブラリ（axios等）を追加せず、まずNode.js標準のグローバル`fetch`
  （`tsconfig.json`の`lib: ES2022` + `@types/node`で型付きで利用可能）で足りるか検討する。
  タイムアウトは`AbortController` + `setTimeout(() => controller.abort(), ms)`で実装し、`finally`で
  必ず`clearTimeout`する。
- エラーハンドリング: 非2xxレスポンスと接続エラー/タイムアウトを区別し、`vscode.window.showErrorMessage`
  でユーザーに次のアクション（例: 「ローカルでPython APIが起動しているか確認してください」）が
  分かるメッセージを表示する。成功時は`vscode.window.showInformationMessage`。
- Webviewからのアクションで拡張ホスト側の処理を呼びたい場合、**fetch等の実処理を持つ既存コマンドを
  `vscode.commands.executeCommand('<コマンドID>')`で呼び出し、Webview側・コマンド側で処理を
  二重実装しない**（実装: `src/webview/SidebarViewProvider.ts`の`onDidReceiveMessage`が
  `vscode-gws-extension.sendFileToApi`をそのまま呼ぶ）。

## Webview側（`src/webview/`, React/TSX）

- 各`WebviewViewProvider`実装（`resolveWebviewView`）では、`webview.options`に
  `enableScripts: true`と`localResourceRoots: [context.extensionUri]`を設定し、HTML内の
  `<script>`はnonceベースのCSP（`Content-Security-Policy: script-src 'nonce-xxx'`）で許可する
  （実装: `src/webview/SidebarViewProvider.ts`）。
- Webview側スクリプトからのHTTPリクエスト等の実処理は書かない。ボタン操作等は
  `acquireVsCodeApi().postMessage({ type: '<メッセージ種別>' })`で拡張ホストに通知し、
  拡張ホスト側の`onDidReceiveMessage`で処理する（Webviewのsandboxからは`fetch`で拡張の設定値
  （`apiBaseUrl`等）を参照できないため）。
- `acquireVsCodeApi()`は1つのWebviewインスタンスにつき1回しか呼び出せない。モジュールスコープの
  シングルトンでラップする（実装: `src/webview/vscodeApi.ts`）。
- Reactのエントリポイント（`index.tsx`）は`react-dom/client`の`createRoot`を使う（React 19系）。
- Webview側TSXは拡張ホスト側とは別の型チェック設定が必要（DOM lib・`jsx: react-jsx`）。
  ルートの`tsconfig.json`ではなく`src/webview/tsconfig.json`（`noEmit`、型チェック専用）を使い、
  ルート`tsconfig.json`の`exclude`に`src/webview`を加えて二重コンパイルを避ける。
- Webview用JS/CSSのバンドルはesbuild（`esbuild.js`、`node esbuild.js` / `node esbuild.js --watch`）で
  単一ファイル（`out/webview/main.js`）へ出力する。拡張ホスト側の`tsc -p ./`ビルドはesbuildに
  置き換えない（役割を分離し、既存ビルドへの影響を最小化する）。

## テスト

- `activationEvents`が空配列の場合、`vscode.commands.getCommands(true)`を呼ぶだけでは拡張は
  activateされない。コマンド登録を確認するテストでは、事前に
  `await vscode.extensions.all.find((e) => e.packageJSON.name === '<name>')?.activate()`で
  明示的にactivateする。
- Webview内部のReact描画（DOM操作・クリック挙動）は`@vscode/test-cli`のExtension Development Host
  テストでは検証しない（webviewはiframe相当で分離されており、テストAPIから直接操作しにくいため）。
  代わりに、`package.json`の`contributes.views`にIDが正しく定義されているかという静的チェックを
  軽量テストとして追加し（実装: `src/test/extension.test.ts`の「サイドバーwebview viewが定義されている」）、
  実際の見た目・操作感はF5でのExtension Development Host起動による目視確認に委ねる。

## VS Code拡張API固有の注意点

- **`contributes.viewsContainers.activitybar[].id`にはドット（`.`）を含められない**
  （英数字・`_`・`-`のみ）。他のcontributes配下のID慣習（コマンドID・設定キーは
  `vscode-gws-extension.xxx`のドット区切り）とは異なる制約のため注意する。ドットを含めた場合、
  拡張は起動するが該当view containerが認識されず、登録した`views`はExplorerへフォールバックされる
  （`npm test`実行時のExtension Development Hostログに
  `property 'id' is mandatory and must be of type 'string' with non-empty value. Only alphanumeric
  characters, '_', and '-' are allowed.`という警告が出る。issue #6で実機確認済み）。
  `contributes.views`のキー（view containerの参照側）・`views[].id`（view自体のID）は
  引き続きドット区切りで問題ない。
