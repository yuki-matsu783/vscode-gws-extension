---
name: vscode-extension-code-reviewer
description: "TODO: vscode-gws-extension（VS Code拡張、TypeScript）のコード変更をプロジェクト規約に照らしてレビューするサブエージェント。コード変更後・コミット前、またはユーザーがレビューを明示的に依頼したときに使う想定だが、参照すべきコーディング規約（ahk-style.md相当）がまだ存在しないため現時点では中身が定義されていない。"
tools: Read, Grep, Glob, Bash
model: sonnet
title: vscode-gws-extension コードレビュアー（TODO）
type: agent
tags: [code-review, agent, todo]
keywords: [directory-structure, docs-workflow, tests-readme, コードレビュー, 読み取り専用, must-fix, should-fix, typescript]
---

**このサブエージェントは現時点では未策定のプレースホルダーです。** `.claude/agents/ahk-code-reviewer.md`
（移植元プロジェクトのAutoHotkey向けコードレビューエージェント）と同等の位置づけで、
vscode-gws-extension（VS Code拡張、TypeScript/React Webview）のコード変更を読み取り専用でレビューする
役割を持つ想定だが、着手時点ではソースコード自体が存在せず、参照すべきコーディング規約
（`.claude/rules/ahk-style.md`相当のTypeScript版）も未策定のため、中身は定義していない。

理由・整備方針は [.claude/skills/vscode-extension-implement/SKILL.md](../skills/vscode-extension-implement/SKILL.md)
と同じ（経緯: [docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 整備するときの参考（ひな形）

移植元の `ahk-code-reviewer.md` は、以下4観点で構成されていた。本エージェントを整備する際は、
この構成をTypeScript/VS Code拡張向けに読み替えることを想定する。

1. **コーディング規約準拠**（`.claude/rules/ahk-style.md`相当。未策定）: 命名規則・言語機能の
   使い分け・エラーハンドリングの型・コメント規約など。
2. **ディレクトリ構成・依存関係準拠**（`.claude/rules/directory-structure.md`）: レイヤー間の
   直接依存禁止・共通処理の切り出し先・エントリポイントの責務範囲など。
3. **ドキュメント運用フローの整合性**（`.claude/rules/docs-workflow.md`）: 対応する
   `docs/spec/機能名.md` の有無・実装内容との整合、DDRの記録漏れ確認。
4. **テストカバレッジ**（`tests/README.md`）: 変更に対応するテストの追加/更新確認。

出力フォーマットは `must-fix` / `should-fix` / `nit` の3段階＋ファイルパス:行番号での指摘、
という形式を踏襲する想定。

TypeScript/VS Code拡張のコーディング規約が決まり次第、上記を具体的なレビュー観点として
書き起こすこと。
