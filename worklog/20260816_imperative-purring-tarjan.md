---
title: サイドバーReact Webviewサンプルの作業ログ
type: log
description: issue #6対応（plans/imperative-purring-tarjan.md）の作業記録
tags: [vscode-extension, react, webview, sidebar]
keywords: [WebviewViewProvider, esbuild, acquireVsCodeApi, sendFileToApi]
---

# 作業ログ（issue #6 / plans/imperative-purring-tarjan.md）

## 経緯

- issue #6の本文がテンプレートのまま未記入だったため、着手前にユーザーへヒアリングした。
  - スコープ: サイドバーReact Webviewサンプルに「アクションのあるボタン」を置き、issue #4の
    `sendFileToApi`コマンド（右クリック→外部Python API送信）につなげたい。
  - 技術構成（ビルドツール・ディレクトリ構成）はエージェントに一任。
- 調査の結果、`contributes.viewsContainers`/`views`・React関連依存・バンドラーはいずれも未導入
  （[docs/ddr/0002](../docs/ddr/0002-yo-codeでTypeScript拡張機能の雛形を作成する.md)で意図的に
  見送られていた領域）と確認。`参考ディレクトリ/`はAutoHotkeyの無関係プロジェクトのため
  React/Webview実装の参考にはならないことも確認した。

## 進捗

- [x] flow-id 1〜3: issue取得・`feature-6-react-webview`ブランチ作成・Draft PR
  [#8](https://github.com/yuki-matsu783/vscode-gws-extension/pull/8) 作成。
- [x] flow-id 4〜5: Plan作成（`plans/imperative-purring-tarjan.md`）・ユーザー承認済み。
- [ ] flow-id 6: 本ファイル作成＋plan commit・push・レビュー依頼（進行中）。
- [ ] flow-id 11以降: 実装。

## 試したこと・判明したこと

（実装作業の中で随時追記する）

## 次にやること

- planのcommit・push、PR descriptionの更新（`describe`）、人間によるplanレビュー待ち。
