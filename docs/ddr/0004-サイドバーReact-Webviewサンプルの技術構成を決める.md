---
title: 0004. サイドバーReact Webviewサンプルの技術構成を決める
type: ddr
description: issue #6対応。Activity Barの左サイドバーに表示するReact Webviewサンプルの、バンドラー選定・ディレクトリ構成・拡張ホストとのメッセージパッシング方式に関する決定を記録したDDR
tags: [ddr, vscode-extension, react, webview, esbuild]
keywords: [WebviewViewProvider, esbuild, acquireVsCodeApi, viewsContainers, sendFileToApi, activitybar, tsconfig]
---

# 0004. サイドバーReact Webviewサンプルの技術構成を決める

## 背景

issue #6「reactで左サイドバーのwebviewサンプルを作成する」は、issue本文が空（目的・現状・期待する
動作・受け入れ条件のいずれも未記載）の状態で着手することになった。着手前にユーザーへ確認したところ、
「アクションのあるボタンを置き、issue #4の右クリックメニュー→外部Python API送信
（`vscode-gws-extension.sendFileToApi`コマンド）につなげたい」というスコープと、技術構成
（ビルドツール・ディレクトリ構成）はエージェントに一任する旨の回答を得た。

着手時点で、`contributes.viewsContainers`/`views`・React関連依存・バンドラー（webpack/esbuild等）は
いずれも未導入であり、[DDR 0002](0002-yo-codeでTypeScript拡張機能の雛形を作成する.md)で
「バンドル化・React Webviewは対象外」と明示的に見送られていた領域だった。

## 決定

1. **Webviewのバンドルにはesbuildを使う。拡張ホスト側（`src/extension.ts`等）の`tsc -p ./`ビルドは
   変更しない。** VS Code公式の拡張バンドリングガイドがesbuildを推奨していること、
   webpack/rollupより設定が単純でこの規模のサンプルに対して過剰でないことを理由に採用した。
   拡張ホスト側は既存の単純な`tsc`ビルドのままで十分動いており、変更する動機が無いため、
   ビルドツールを一本化する（両方をesbuild化する）案は見送った。
2. **`src/webview/`を新設し、拡張ホストコードとWebviewコードをディレクトリで分離する。**
   `src/extension.ts`は1ファイルのままで十分小さいため、`src/extension/`への分割は行わない
   （詳細: [.claude/rules/directory-structure.md](../../.claude/rules/directory-structure.md)）。
   Webview側は独立した`src/webview/tsconfig.json`（`jsx: react-jsx`, `lib: DOM`追加, `noEmit`）で
   型チェックし、ルートの`tsconfig.json`は`exclude`に`src/webview`を加えて素の`tsc`との衝突を防ぐ。
3. **WebviewからのアクションはpostMessage経由で拡張ホストに伝え、拡張ホストが既存の
   `vscode-gws-extension.sendFileToApi`コマンドを`executeCommand`で呼び出す。fetch実装は
   Webview側・コマンド側で二重に持たない。** Webviewのsandboxからは拡張の設定値
   （`apiBaseUrl`）を直接参照できないため、実処理は拡張ホスト側に置く必要があり、
   既存コマンドが`uri`未指定時に`activeTextEditor`へフォールバックする実装を再利用することで、
   「現在アクティブなファイルを送信するボタン」を新規実装なしで実現できた。
4. **`contributes.viewsContainers.activitybar[].id`にはドット（`.`）を含めない。**
   実装当初は他のcontributes ID（コマンドID等）に倣い`vscode-gws-extension.sidebar`としたが、
   `npm test`実行時のExtension Development Hostログで
   `property 'id' is mandatory ... Only alphanumeric characters, '_', and '-' are allowed`
   という警告が出て、view containerが認識されずviewがExplorerへフォールバックすることが
   実機確認で判明した。`vscode-gws-extension-sidebar`（ハイフン区切り）に修正した。この制約は
   [.claude/rules/vscode-extension-style.md](../../.claude/rules/vscode-extension-style.md)にも
   反映済み。

## 却下した案

- **webpackを使う案**: 設定項目が多くこの規模のサンプルには過剰と判断し、esbuildを採用した。
- **拡張ホスト側も含めてesbuildへ全面移行する案**: 既存の`tsc -p ./`ビルドは変更する必要が無く、
  Webview追加のために無関係な既存ビルドまで変更するのはissueのスコープを超えると判断し見送った。
  将来`vsce package`化等でビルド方針を見直す際に改めて検討する。
- **Webview側で直接`fetch`する案**: Webviewのsandbox環境では拡張の設定値（`apiBaseUrl`）を
  参照できず、CSPの制約もあるため、拡張ホスト側の既存コマンドを呼び出す方式を採用した
  （実装の二重化も避けられる）。
