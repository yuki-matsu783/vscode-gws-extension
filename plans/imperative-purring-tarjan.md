---
title: サイドバーReact Webviewサンプルの実装計画
type: plan
description: issue #6対応。Activity Barの左サイドバーにReact WebviewViewを追加し、issue #4のsendFileToApiコマンドをボタンから呼び出せるサンプルを作る計画
resource: https://github.com/yuki-matsu783/vscode-gws-extension/issues/6
tags: [vscode-extension, react, webview, sidebar]
keywords: [WebviewViewProvider, esbuild, acquireVsCodeApi, viewsContainers, sendFileToApi, activitybar]
---

# サイドバーReact Webviewサンプルの実装計画（issue #6）

## Context

issue #6「reactで左サイドバーのwebviewサンプルを作成する」は本文が未記入だったため、ユーザーに
ヒアリングした。目的は次の2点:

1. Activity Barの左サイドバーに表示するReact Webviewのサンプルを作る（issue本文タイトルどおり）。
2. ただの静的表示ではなく、「ちょっとアクションのあるボタン」を置き、issue #4で作った右クリック
   メニュー→外部Python API送信（`vscode-gws-extension.sendFileToApi`コマンド）につなげたい。

技術構成（ビルドツール・ディレクトリ構成）はエージェントに一任された。現状の拡張は`yo code`雛形の
ままで、Reactやバンドラー（webpack/esbuild等）は未導入（[docs/ddr/0002](../docs/ddr/0002-yo-codeでTypeScript拡張機能の雛形を作成する.md)
で「バンドラー選定は見送り」と明記されている）。また`.claude/rules/directory-structure.md`の
「TODO: 拡張本体（src/）のディレクトリ構成」節は、まさに本issue（Webview追加時）で解消することが
指示されている。

## 実施内容

### 1. 依存関係・ビルド

- 新規依存: `react`, `react-dom`（webview UI）、`esbuild`, `@types/react`, `@types/react-dom`（devDependencies）。
- Webview側のJS/CSSは、VS Codeの拡張バンドリング公式ガイドに沿って**esbuildで単一ファイルへバンドル**する
  （拡張ホスト側の`tsc -p ./`ビルドはそのまま維持し、破壊的変更をしない。webview用に新たに
  `esbuild.js`をNode CJSスクリプトとして追加し、`entryPoints: ['src/webview/index.tsx']`,
  `bundle: true`, `platform: 'browser'`, `format: 'iife'`, `outfile: 'out/webview/main.js'`,
  `jsx: 'automatic'`で設定する）。
- `package.json`の`scripts.compile`を`tsc -p ./ && tsc --noEmit -p src/webview && node esbuild.js`に、
  `scripts.watch`にwebview向けの監視スクリプトを追加する。

### 2. ディレクトリ構成（`src/webview/`を新設）

```
src/
├── extension.ts                 # 既存。activate()にWebviewViewProvider登録を追加するのみ
├── webview/
│   ├── SidebarViewProvider.ts   # ホスト側: vscode.WebviewViewProvider実装、HTML生成、CSP/nonce、
│   │                             #           postMessage受信→ sendFileToApiコマンド実行
│   ├── index.tsx                 # webview側Reactエントリポイント（createRoot）
│   ├── App.tsx                    # 送信ボタン+簡易ステータス表示のReactコンポーネント
│   ├── vscodeApi.ts               # acquireVsCodeApi()の単一取得ラッパー（複数回呼ぶとエラーになるため）
│   └── tsconfig.json              # webview専用の型チェックtsconfig（jsx: react-jsx, lib: DOM追加, noEmit）
└── test/extension.test.ts        # 既存。view定義の静的チェックテストを1件追加
media/
└── icon.svg                       # Activity Bar用モノクロアイコン（新規）
esbuild.js                         # webviewバンドル用ビルドスクリプト（新規）
```

- ルート`tsconfig.json`の`exclude`に`src/webview`を追加する（JSX構文・DOM libがルート設定に
  無いため、素の`tsc -p ./`が混在コンパイルでエラーになるのを防ぐ）。
- `eslint.config.mjs`の対象`files`に`**/*.tsx`を追加する。

このファイル構成・切り分け方針は、`.claude/rules/directory-structure.md`のTODO節（および
`.claude/skills/vscode-extension-implement/SKILL.md` / `.claude/agents/vscode-extension-code-reviewer.md`
のTODO）を埋めるための決定として、flow-id 16〜17（設計反映・AIアセット改善）で反映する
（本Planでは実装優先、反映作業はworklogに記録した上で後続ステップで行う）。

### 3. `package.json`のcontributes追加

```jsonc
"viewsContainers": {
  "activitybar": [
    { "id": "vscode-gws-extension.sidebar", "title": "GWS", "icon": "media/icon.svg" }
  ]
},
"views": {
  "vscode-gws-extension.sidebar": [
    { "type": "webview", "id": "vscode-gws-extension.sidebarView", "name": "GWS", "contextualTitle": "GWS" }
  ]
}
```

既存の`commands`/`menus`/`configuration`（issue #4分）は変更しない。

### 4. WebviewViewProviderの実装（`SidebarViewProvider.ts`）

- `resolveWebviewView(webviewView)`で`webview.options = { enableScripts: true, localResourceRoots: [extensionUri] }`
  を設定し、`webview.asWebviewUri()`で`out/webview/main.js`を参照するHTMLを返す。
  nonceベースのCSP（`script-src 'nonce-xxx'`）を設定し、VS Code公式ガイドのセキュリティ推奨に沿う。
- `webview.onDidReceiveMessage`で、Reactボタン押下時に送られる`{ type: 'sendFileToApi' }`を受信し、
  **既存の`vscode-gws-extension.sendFileToApi`コマンドを`vscode.commands.executeCommand`で
  引数なし実行する**（新規のfetch実装は書かない。既存の`sendFileToApi`は`uri`未指定時に
  `activeTextEditor`のドキュメントへフォールバックする実装済みのため、そのまま「現在アクティブな
  ファイルを外部APIへ送信するボタン」として機能する。エラー・成功通知も既存コマンドの
  `showInformationMessage`/`showErrorMessage`をそのまま利用でき、二重実装を避けられる）。
- `src/extension.ts`の`activate()`に
  `context.subscriptions.push(vscode.window.registerWebviewViewProvider('vscode-gws-extension.sidebarView', new SidebarViewProvider(context.extensionUri)))`
  を追加する。

### 5. Reactアプリ（`App.tsx`）

- 「現在のファイルを外部APIへ送信」ボタン1つ + 直近の送信状態を表す1行のステータス表示
  （「送信中…」→ボタン押下直後に表示するのみ。詳細な成功/失敗結果は既存コマンドの通知に委譲し、
  webview側では結果の中身までは持たない。サンプルとしてスコープを絞る）。
- `vscodeApi.ts`で`acquireVsCodeApi()`を1度だけ呼び出し、`postMessage`はそのインスタンス経由で行う。

### 6. テスト

- `src/test/extension.test.ts`に、`vscode.extensions.all`から本拡張の`packageJSON.contributes.views`を
  読み、`vscode-gws-extension.sidebarView`が定義されていることを確認する軽量テストを1件追加する
  （静的なmanifestチェック。webview内部のReact描画自体は既存の`docs/spec`の前例
  （[右クリックで外部APIへリクエストを送信する.md](../docs/spec/右クリックで外部APIへリクエストを送信する.md)
  「テストはコマンド登録の確認のみ」）に倣い、CI自動テスト対象外としF5での目視確認に委ねる）。

## 対象外

- Python API側の実装・エンドポイント契約の変更（issue #4のスコープを踏襲し、今回は変更しない）。
- webview内での送信結果（レスポンス本文）の表示。既存コマンドの通知メッセージで代替する。
- `vsce package`によるパッケージング・Marketplace配布（[DDR 0002](../docs/ddr/0002-yo-codeでTypeScript拡張機能の雛形を作成する.md)
  と同様、引き続き対象外）。
- `src/extension.ts`を`src/extension/`ディレクトリへ分割する変更（現状1ファイルで十分小さいため、
  今回は`src/webview/`のみ新設し、既存ファイル配置は変えない）。

## 検証方法

1. `npm install`（新規依存追加）→ `npm run compile`が成功すること（`tsc -p ./`・
   `tsc --noEmit -p src/webview`・`esbuild.js`の3つとも成功し、`out/webview/main.js`が生成される）。
2. `npm run lint`が成功すること。
3. `npm test`（`@vscode/test-cli`）で、既存のコマンド登録テストと追加したview定義テストが通ること。
4. F5でExtension Development Hostを起動し、Activity Barに新アイコンが表示されること、クリックで
   サイドバーにReactのボタンが表示されることを目視確認する。適当なファイルを開いた状態でボタンを
   押し、（ローカルでPython APIサンプルを起動していない場合は）接続エラー通知が、起動していれば
   送信成功通知が表示されることを確認する（issue #4の右クリックメニュー版と同じ通知系統であること
   も合わせて確認する）。
