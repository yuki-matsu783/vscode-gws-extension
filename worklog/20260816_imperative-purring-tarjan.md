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
- [x] flow-id 6: plan/worklog/HANDOFF commit・push、PR description更新。
- [x] flow-id 7〜9: 人間から「レビューOK」の合図。`get_mr_unresolved_comments 8 true`で
  未解決コメント0件（自動投稿の工数レポートのみ）と確認し、次へ進んだ。
- [x] flow-id 11: 実装完了（下記「試したこと・判明したこと」参照）。
- [x] flow-id 12〜13: commit・push（[890a2e0](https://github.com/yuki-matsu783/vscode-gws-extension/commit/890a2e0)）、
  PR description更新。
- [x] flow-id 14〜15: F5でのユーザー目視確認（ボタン押下でステータス表示が想定どおり出ることを確認）→
  「レビューOK」の合図。`get_mr_unresolved_comments 8 true`で未解決コメント0件を再確認し、次へ進んだ。
- [x] flow-id 16〜17: 設計反映・AIアセット改善（下記「設計反映・AIアセット改善」参照）。

## 試したこと・判明したこと

- planどおり `src/webview/`（`SidebarViewProvider.ts`, `index.tsx`, `App.tsx`, `vscodeApi.ts`,
  `tsconfig.json`）・`esbuild.js`・`media/icon.svg` を新規作成し、`package.json`に
  `viewsContainers`/`views`・`react`/`react-dom`/`esbuild`等の依存・`scripts.compile`
  （`tsc -p ./ && tsc --noEmit -p src/webview && node esbuild.js`）を追加。
  `tsconfig.json`の`exclude`に`src/webview`を追加し、`eslint.config.mjs`の対象に`**/*.tsx`を追加。
- `src/extension.ts`の`activate()`に`vscode.window.registerWebviewViewProvider(...)`を追加し、
  `SidebarViewProvider`をサイドバーに登録。ボタン押下→`postMessage({type:'sendFileToApi'})`→
  `onDidReceiveMessage`で既存の`vscode-gws-extension.sendFileToApi`コマンドを`executeCommand`
  実行、という流れをplanどおり実装（fetch実装の二重化なし）。
- `npm install`・`npm run compile`・`npm run lint`は初回から成功。
- **実機確認で判明した不具合**: `npm test`（`@vscode/test-cli`によるExtension Development Host起動）の
  ログに
  ```
  property `id` is mandatory and must be of type `string` with non-empty value.
  Only alphanumeric characters, '_', and '-' are allowed.
  View container 'vscode-gws-extension.sidebar' does not exist and all views registered to it
  will be added to 'Explorer'.
  ```
  という警告が出力された。**`contributes.viewsContainers.activitybar[].id`にはドット（`.`）を
  含められない**（他のcontributes配下のID慣習（`vscode-gws-extension.sendFileToApi`等）とは異なる
  制約）ため、`vscode-gws-extension.sidebar`が無効なIDとして扱われ、Activity Barへ登録されず
  Explorerへフォールバックしていた。IDを`vscode-gws-extension-sidebar`（ドット→ハイフン）へ
  修正し、`src/test/extension.test.ts`の参照キーも合わせて修正。修正後は該当警告が消え、
  `npm test`が3件とも成功することを確認した。
  **この知見はAIアセット改善（flow-id 17）で反映する。**
- `npm test`はheadlessなExtension Development Hostを実際に起動するため、上記の
  「View containerが登録されているか」の間接検証（警告有無）は自動テストで拾えたが、
  Activity Barアイコン・webview内のReactボタンの見た目自体はF5でのGUI目視確認が必要
  （このセッションはGUI操作不可のため未実施だったが、flow-id 14でユーザーがF5確認済み。
  想定どおりのボタン・ステータス表示だったとの報告を受けた）。

## 設計反映・AIアセット改善（flow-id 16〜17）

- `docs/spec/サイドバーにReact Webviewを表示する.md`を新規作成（issue #4のspecと同じ章立て）。
- `docs/ddr/0004-サイドバーReact-Webviewサンプルの技術構成を決める.md`を新規作成
  （esbuild採用・拡張ホストのtscビルドは変更しない・`src/webview/`分離・
  postMessageで既存コマンドを再利用・`viewsContainers` idのドット制約、の4決定を記録）。
- `docs/README.md`・`index.md`に上記2ファイルへのリンク・記述更新を反映。
- **AIアセット改善**: `.claude/rules/directory-structure.md`の「TODO: 拡張本体のディレクトリ構成」
  節がまさに本issueで解消することを指示していたため対応。
  - `.claude/rules/vscode-extension-style.md`を新規作成（TypeScript/React Webviewのコーディング
    規約。issue #4・#6双方の実装で判明した知見をまとめて集約）。
  - `.claude/skills/vscode-extension-implement/SKILL.md`のTODOプレースホルダーを解消し、
    具体的な実装サブフローとして書き起こした。
  - `.claude/agents/vscode-extension-code-reviewer.md`のTODOプレースホルダーを解消し、
    4つのレビュー観点を具体化した。
  - `.claude/rules/directory-structure.md`の該当TODO節を、実際に決定した構成の説明へ置き換えた。
- `dev-tools/src/extract-frontmatter.sh docs` / `.claude` で`index.jsonl`群を再生成
  （新規spec/ddr/rule/skill/agentファイルをインデックスへ反映）。

## 次にやること

- flow-id 18: commit・push・レビュー依頼。
