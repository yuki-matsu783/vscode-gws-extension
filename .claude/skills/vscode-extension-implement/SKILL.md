---
name: vscode-extension-implement
description: "vscode-gws-extension（VS Code拡張、TypeScript/React Webview）で新機能の追加や既存動作の変更を行うときに使うサブフロー。.claude/skills/issue-mr-flow/SKILL.mdの「設計ドキュメント作成〜実装」ステップを、本拡張のディレクトリ構成・コーディング規約に沿って具体化する。"
title: vscode-gws-extension 実装フロー
type: skill
tags: [implement, skill, typescript, react, webview]
keywords: [設計ドキュメント, docs-spec, planモード, worklog, handoff, issue-mr-flow, typescript, コーディング規約, vscode-extension-style]
---

# vscode-gws-extension 実装フロー

`.claude/skills/issue-mr-flow/SKILL.md`（唯一の実装フロー定義）の全体フローのうち、「設計ドキュメント
作成〜実装」ステップ（flow-id 4, 11）をvscode-gws-extension（VS Code拡張、TypeScript/React Webview）
向けに実行手順へ落とし込む。issue #2（雛形作成）・issue #4（右クリックメニュー→外部API送信サンプル）・
issue #6（サイドバーReact Webviewサンプル）を経て、ディレクトリ構成・コーディング規約が定まった
（経緯: [docs/ddr/0002](../../../docs/ddr/0002-yo-codeでTypeScript拡張機能の雛形を作成する.md),
[docs/ddr/0004](../../../docs/ddr/0004-サイドバーReact-Webviewサンプルの技術構成を決める.md)）ため、
本ファイルの内容として書き起こす。

## 手順

1. **設計ドキュメントを作成する（Planモード内、flow-id 4）**: 変更・新規追加する機能について、
   `docs/spec/機能名.md`を既存specと同じ章立て（背景・目的／仕様／影響範囲／設定項目／
   未決定事項・懸念点）で書く内容をPlanに含める。新規specファイル自体の作成・commitは
   flow-id 16（設計反映）で行う（Planの時点ではまだ実装前のため、spec本文の確定はPlan承認後の
   実装結果を踏まえて行う）。
2. **人間の承認を得る**: `.claude/skills/issue-mr-flow/SKILL.md`のflow-id 5（Plan承認）・
   flow-id 7〜8（Planに対するレビューループ）を経るまでコードの実装には着手しない。
3. **実装する（flow-id 11）**: `.claude/rules/directory-structure.md`が定める`src/`構成
   （拡張ホスト = `src/extension.ts`、React Webview = `src/webview/`）と、
   `.claude/rules/vscode-extension-style.md`（命名規則・コマンド登録パターン・Webviewの
   メッセージパッシング・VS Code拡張API固有の制約等）に従う。エントリポイントとなるファイル
   （コマンドハンドラ・`WebviewViewProvider`実装等）の冒頭に、対応する設計ドキュメントへの
   参照コメントを入れる。
4. **ビルド・テストで検証する**: `npm run compile`（拡張ホストの`tsc` → Webviewの
   `tsc --noEmit`型チェック → `esbuild.js`によるWebviewバンドル）・`npm run lint`・`npm test`
   （`@vscode/test-cli`）がすべて成功することを確認する。Webview内部のReact描画・見た目は
   自動テスト対象外のため、F5でのExtension Development Host起動による目視確認を行う
   （このセッションがGUI操作不可の場合はユーザーに確認を依頼する）。
5. **整合性を維持する（flow-id 16〜17）**: 実装完了後、設計反映（`docs/spec/`の新規作成・上書き、
   `docs/ddr/`への意思決定記録、実装中に得た再現性のある知見の
   `.claude/rules/vscode-extension-style.md`への反映）とAIアセット改善を行ってから、
   `worklog/`削除・`HANDOFF.md`リセットを経てPRのDraftを解除する。

## 参照

- ディレクトリ構成: [.claude/rules/directory-structure.md](../../rules/directory-structure.md)
- コーディング規約: [.claude/rules/vscode-extension-style.md](../../rules/vscode-extension-style.md)
- コードレビュー観点: [.claude/agents/vscode-extension-code-reviewer.md](../../agents/vscode-extension-code-reviewer.md)
