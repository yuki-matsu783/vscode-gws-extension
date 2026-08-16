---
title: メインエディタにReact Webviewを表示する（サンプル）
type: spec
description: コマンドパレットからメインエディタ領域にReact Webviewパネルを開き、ボタン押下で既存の外部API送信コマンドを呼び出すサンプルの仕様
resource: https://github.com/yuki-matsu783/vscode-gws-extension/issues/7
tags: [vscode-extension, react, webview, webview-panel, sample]
keywords: [WebviewPanel, createWebviewPanel, EditorPanelProvider, ViewColumn, sendFileToApi, postMessage, acquireVsCodeApi, esbuild, CSP, nonce, シングルトン]
---

# メインエディタにReact Webviewを表示する（サンプル）

## 背景・目的

issue #7対応。issue #6（サイドバーReact Webviewサンプル）の「Webview UIから拡張ホストの既存機能を
呼び出す」導線を、`vscode.WebviewViewProvider`（サイドバー常駐）ではなく
`vscode.window.createWebviewPanel`（コマンドから開くメインエディタ領域のタブ）方式で示すサンプル。

issue #7の本文も、issue #6と同様に目的・現状・期待する動作・受け入れ条件が未記入の状態で着手した。
着手前にユーザーへ確認し、issue #6を踏襲した最小サンプルとして実装する方針で合意を得ている。

技術構成の決定経緯は
[docs/ddr/0005-メインエディタReact-Webviewサンプルの技術構成を決める.md](../ddr/0005-メインエディタReact-Webviewサンプルの技術構成を決める.md)
を参照。

## 仕様

### コマンド・Panel定義

- コマンド: `contributes.commands`に`vscode-gws-extension.openEditorPanel`
  （タイトル「GWS: メインエディタにReact Webviewを開く（サンプル）」）を追加。
  `contributes.views`/`viewsContainers`への登録は不要（`WebviewPanel`はランタイムAPIから
  動的に開くため、静的な宣言を必要としない）。
- 実装: [src/webview/EditorPanelProvider.ts](../../src/webview/EditorPanelProvider.ts)。
  VS Code公式`webview-sample`の`CatCodingPanel`パターンに準拠したシングルトン管理クラス。
  - `createOrShow(extensionUri)`: 既存パネルがあれば`panel.reveal(column)`、無ければ
    `vscode.window.createWebviewPanel`で新規作成する静的メソッド。`src/extension.ts`の
    `activate()`から`registerCommand`のハンドラとして呼ばれる。
  - `viewType`（コード内定数のみ、`package.json`宣言不要）: `vscode-gws-extension.editorPanel`。
  - パネルタイトル: 「GWS メインエディタサンプル」。
  - `ViewColumn`: `vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One`
    （現在アクティブなエディタ列に開く）。
  - `retainContextWhenHidden`は指定しない（非表示→再表示時にステータス表示がリセットされても
    実害が無いサンプルのため。詳細: DDR 0005）。
  - `onDidDispose`でパネルが閉じられた際に`currentPanel`を`undefined`へリセットし、
    蓄積した`disposables`を解放する。

### Webview UI

- [src/webview/EditorApp.tsx](../../src/webview/EditorApp.tsx): issue #6の
  [App.tsx](../../src/webview/App.tsx)と同じ「ボタン1つ＋ステータス1行」構成。説明文のみ
  メインエディタ向けに変更（「これはメインエディタ領域に表示するReact Webviewサンプルです。」）。
- [src/webview/editorPanelIndex.tsx](../../src/webview/editorPanelIndex.tsx):
  `react-dom/client`の`createRoot`で`EditorApp`をマウントするエントリポイント
  （[index.tsx](../../src/webview/index.tsx)と同構造）。
- [src/webview/vscodeApi.ts](../../src/webview/vscodeApi.ts)はサイドバー版と共有する
  （新規作成しない。esbuildが2バンドルとも別ファイルへ出力するため、`acquireVsCodeApi()`の
  シングルトン制約はバンドル単位で独立して満たされる）。

### 拡張ホストとのメッセージパッシング

- ボタン押下時、Webview側は`acquireVsCodeApi().postMessage({ type: 'sendFileToApi' })`を送る
  （issue #6と同一のメッセージ種別を再利用し、新規種別は追加しない）。
- `EditorPanelProvider`の`onDidReceiveMessage`で受信し、
  `vscode.commands.executeCommand('vscode-gws-extension.sendFileToApi')`を実行する。
  fetch等の実処理は`sendFileToApi`コマンド側にのみ存在し、二重実装しない
  （詳細: [docs/spec/サイドバーにReact Webviewを表示する.md](サイドバーにReact Webviewを表示する.md)
  「拡張ホストとのメッセージパッシング」と同じ設計）。

### セキュリティ（CSP）

- [src/webview/getWebviewHtml.ts](../../src/webview/getWebviewHtml.ts)に、
  `SidebarViewProvider`と`EditorPanelProvider`が共有するCSP/nonce生成ロジックを集約した
  （`SidebarViewProvider.ts`が持っていた`getHtml`/`getNonce`のインライン実装から抽出）。
  CSP文字列・HTML構造はissue #6実装時から変更していない
  （`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`）。
- `createWebviewPanel`のオプション引数に`enableScripts: true`と
  `localResourceRoots: [extensionUri]`を設定する（`WebviewView`と同じ制約）。

### ビルド

- [esbuild.js](../../esbuild.js)の`entryPoints`を配列オブジェクト形式に変更し、
  `src/webview/index.tsx`（サイドバー、出力`out/webview/main.js`）と
  `src/webview/editorPanelIndex.tsx`（エディタパネル、出力`out/webview/editorPanel.js`）の
  2エントリポイントを1回のビルドで出力する（`outfile`→`outdir: 'out/webview'`に変更）。
  `npm run compile`/`watch:webview`のコマンド自体は変更していない。

## 影響範囲

- [package.json](../../package.json): `contributes.commands`にエントリを1件追加。
  `contributes.views`/`viewsContainers`/`scripts`/依存関係は変更なし。
- [src/extension.ts](../../src/extension.ts): `EditorPanelProvider`のimportと、
  `vscode-gws-extension.openEditorPanel`コマンドの`registerCommand`登録を追加。
- [src/webview/](../../src/webview/): `EditorPanelProvider.ts`, `EditorApp.tsx`,
  `editorPanelIndex.tsx`, `getWebviewHtml.ts`を新規追加。
  [SidebarViewProvider.ts](../../src/webview/SidebarViewProvider.ts)は`getHtml`/`getNonce`の
  インライン実装を`getWebviewHtml.ts`呼び出しに置き換え（挙動不変）。
- [esbuild.js](../../esbuild.js): entry pointの複数化。
- [src/test/extension.test.ts](../../src/test/extension.test.ts): コマンド登録テストに
  `vscode-gws-extension.openEditorPanel`のアサーションを追加。

## 設定項目

新規の設定項目は無し（`sendFileToApi`コマンド経由で既存の`vscode-gws-extension.apiBaseUrl`を
そのまま利用する）。

## 未決定事項・懸念点

- **`retainContextWhenHidden: false`（未指定）による状態リセットを許容している**:
  パネルが非表示→再表示された際、Reactコンポーネントの状態（ステータス表示）がリセットされる。
  本サンプルの性質上実害は無いと判断しているが、将来パネル内に永続したい状態を持たせる場合は
  `true`への変更を検討する。
- **Webview内部のReact描画・DOM操作の自動テストは対象外**: issue #6の方針を踏襲し、
  `@vscode/test-cli`によるExtension Development Hostテストではコマンド登録の静的チェックのみ
  行い、実際の見た目・パネルの開閉・ボタン操作はF5での目視確認に委ねている。実装時には一時的な
  検証用テスト（`vscode.window.tabGroups`でWebviewPanelタブの開閉・シングルトン動作を確認）を
  作成して動作確認した後、恒久テストには含めずに削除した。
- **`App.tsx`と`EditorApp.tsx`の共有化は見送った**: 消費者が2つしかない時点で`props`化するのは
  時期尚早な抽象化と判断し、それぞれのProviderと1:1で完結する独立コンポーネントとした
  （詳細: DDR 0005）。
