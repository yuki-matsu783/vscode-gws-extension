---
title: issue #7 メインエディタ領域のReact Webviewサンプルを作成する
type: log
description: WebviewPanelを使ったメインエディタ領域向けReact Webviewサンプルの実装計画
resource: https://github.com/yuki-matsu783/vscode-gws-extension/issues/7
tags: [webview, react, vscode-extension, webview-panel]
keywords: [WebviewPanel, createWebviewPanel, EditorPanelProvider, esbuild, CSP, nonce, シングルトン, postMessage, sendFileToApi, DDR]
---

## Context

issue #7「reactでメインエディタ領域のwebviewサンプルを作成する」への対応。issue本文は目的・現状・
期待する動作・受け入れ条件の4見出しはあるが中身は未記入（プレースホルダのまま）だったため、
ユーザーに確認のうえ、issue #6（サイドバーReact Webviewサンプル、PR #8でmainにマージ済み）の実装
パターンをそのまま踏襲した最小サンプルとして進めることで合意した。issue #6は`vscode.WebviewViewProvider`
（サイドバー常駐）方式だったのに対し、今回は`vscode.window.createWebviewPanel`（コマンドから開く
エディタタブ）方式を新規に扱う。

## 実施内容

### 新規ファイル（`src/webview/`）

- `getWebviewHtml.ts`: `SidebarViewProvider.getHtml`/`getNonce`から抽出する、CSP/nonceベースの
  HTML生成共有ユーティリティ。シグネチャ: `getWebviewHtml(webview, extensionUri, scriptPathSegments: string[])`。
  CSP文字列・HTML構造は既存と完全に同一のまま移設する（挙動変更なし）。
- `EditorApp.tsx`: `App.tsx`と同じ「ボタン1つ＋ステータス1行」構成。文言のみメインエディタ向けに
  差別化（説明文・パネルタイトルで区別。ボタン押下時の`postMessage`種別は既存`sendFileToApi`を再利用）。
- `editorPanelIndex.tsx`: `index.tsx`と同構造のReactエントリポイント（`createRoot`で`EditorApp`をマウント）。
- `EditorPanelProvider.ts`: `createWebviewPanel`のシングルトン管理クラス（VS Code公式`webview-sample`の
  `CatCodingPanel`パターン準拠）。`createOrShow(extensionUri)`静的メソッド、`currentPanel`静的参照、
  `onDidReceiveMessage`で`sendFileToApi`コマンドをexecuteCommand、`onDidDispose`でクリーンアップ。
  `ViewColumn`は`activeTextEditor?.viewColumn ?? ViewColumn.One`。`retainContextWhenHidden`は指定しない。

`vscodeApi.ts`は新規作成せず既存を共有import（esbuildは2バンドルとも別ファイルへ出力するため、
`acquireVsCodeApi()`のシングルトン制約はバンドル単位で独立して満たされる）。

### 変更ファイル

- `esbuild.js`: `entryPoints`を配列オブジェクト形式に変更し`main`/`editorPanel`の2出力にする。
  `outfile`→`outdir: 'out/webview'`。既存の`main.js`という出力名は`out: 'main'`指定で維持。
- `src/webview/SidebarViewProvider.ts`: `getHtml`/`getNonce`のインライン実装を`getWebviewHtml.ts`
  呼び出しに置き換え（挙動不変）。
- `src/extension.ts`: `EditorPanelProvider`をimportし、コマンド`vscode-gws-extension.openEditorPanel`を
  `registerCommand`で登録、`context.subscriptions.push`に追加。
- `package.json`: `contributes.commands`に`vscode-gws-extension.openEditorPanel`
  （タイトル: `GWS: メインエディタにReact Webviewを開く（サンプル）`）を追加。
  `contributes.views`/`viewsContainers`/`scripts`/依存関係は変更不要。
- `src/test/extension.test.ts`: コマンド登録テストに`vscode-gws-extension.openEditorPanel`の
  アサーションを1行追加。React描画自体のテストは追加しない（issue #6の方針を踏襲）。

### 命名

| 項目 | 値 |
|---|---|
| コマンドID | `vscode-gws-extension.openEditorPanel` |
| viewType（コード内定数のみ、package.json宣言不要） | `vscode-gws-extension.editorPanel` |
| パネルタイトル | `GWS メインエディタサンプル` |
| postMessage種別 | `sendFileToApi`（新規種別は追加しない） |

### ドキュメント（設計反映タイミングで作成）

- `docs/spec/メインエディタにReact Webviewを表示する.md`（新規、サイドバー版と同じ章立てパターン）
- `docs/ddr/0005-メインエディタReact-Webviewサンプルの技術構成を決める.md`（新規）。記録する決定:
  WebviewPanelシングルトン管理パターンの採用、esbuild複数entry point化、CSP/nonce生成ロジックの
  共通化、ViewColumn/`retainContextWhenHidden`方針。単純にissue #6を踏襲するだけでなく上記の
  代替案検討・却下判断があるためDDR化する。

### 実装順序

1. `esbuild.js`を複数entry point化 → 既存`main.js`出力に影響がないことを確認
2. `getWebviewHtml.ts`抽出 → `SidebarViewProvider.ts`を置き換え（挙動不変確認）
3. `EditorApp.tsx` / `editorPanelIndex.tsx`作成
4. `EditorPanelProvider.ts`作成
5. `extension.ts`にコマンド登録
6. `package.json`に`contributes.commands`追加
7. `extension.test.ts`にアサーション追加
8. `npm run compile` → `npm run lint` → `npm test`
9. F5でExtension Development Host起動、コマンドパレットから動作確認（パネルオープン、ボタン押下、
   2回目実行でreveal、サイドバーGWS viewの回帰確認）

## 対象外

- issue #6のApp.tsxをprops化して共有する対応（時期尚早な抽象化のため見送り）
- `retainContextWhenHidden: true`によるパネル状態保持（サンプルの性質上不要と判断）
- Webview内部のReact描画・DOM操作の自動テスト（issue #6同様、方針として対象外）

## 検証方法

- `npm run compile`（`tsc -p ./` + webview型チェック + esbuild）がエラー無く完了し、
  `out/webview/main.js`・`out/webview/editorPanel.js`の両方が生成されること
- `npm run lint` / `npm test`が通ること
- F5でExtension Development Hostを起動し、コマンドパレットから
  「GWS: メインエディタにReact Webviewを開く（サンプル）」を実行してパネルが開くこと、
  ボタン押下で通知が表示されること、再実行時に新規パネルが増えず既存パネルがrevealされること、
  サイドバーのGWS viewが引き続き正常表示されることを目視確認する
