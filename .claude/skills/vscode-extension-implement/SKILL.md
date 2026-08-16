---
name: vscode-extension-implement
description: "TODO: vscode-gws-extension（VS Code拡張、TypeScript）で新機能の追加や既存動作の変更を行うときに使うサブフロー。.claude/skills/issue-mr-flow/SKILL.mdから呼ばれる想定だが、ソースコード・コーディング規約が未確定のため現時点では中身が定義されていない。"
title: vscode-gws-extension 実装フロー（TODO）
type: skill
tags: [implement, skill, todo]
keywords: [設計ドキュメント, docs-spec, planモード, worklog, handoff, issue-mr-flow, typescript, コーディング規約]
---

# vscode-gws-extension 実装フロー（TODO）

**このスキルは現時点では未策定のプレースホルダーです。** `.claude/skills/issue-mr-flow/SKILL.md`
（唯一の実装フロー定義）の全体フローのうち、「設計ドキュメント作成〜実装」ステップをvscode-gws-extension
（VS Code拡張、TypeScript/React Webview）向けに実行手順へ落とし込む役割を持つ想定だが、着手時点では
ソースコード自体が存在せず、コーディング規約（命名規則・ディレクトリ構成・エラーハンドリング方針等）も
未確定のため、中身は定義していない。

## 未策定である理由

- 拡張本体（`src/`, `package.json`等）のディレクトリ構成が未確定（`.claude/rules/directory-structure.md`
  のTODO節参照）。
- TypeScript/React Webviewのコーディング規約（`.claude/rules/`配下に相当ファイルが無い）が未策定。
- ビルド・パッケージング方針（`vsce package`等）も未確定。

これらを実装が進む前に先回りして規約化すると、実態と乖離したルールが残るリスクがあるため、
今回のAI開発資産移植では意図的に整備を見送った（経緯:
[docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 整備するときの参考（ひな形）

移植元プロジェクトの `ahk-implement` スキル（AutoHotkey向けの同種スキル）は、以下の構成だった。
本スキルを整備する際は、この構成をTypeScript/VS Code拡張向けに読み替えることを想定する。

1. **設計ドキュメントを作成する**: `docs/spec/機能名.md` を、既存specと同じ章立て
   （背景・目的／仕様／影響範囲／設定項目／未決定事項・懸念点）で新規作成する。
2. **人間の承認を得る**: 明示的な承認を得るまでコードの実装には着手しない。
3. **方針を計画する**: featureブランチを作成し、Planモードで手順を作成・`plans/`へ出力、
   `worklog/日付_<plan名>.md`を作成する。
4. **実装する**: コーディング規約（未策定。将来 `.claude/rules/<何か>-style.md` 相当を作る）に従う。
   エントリポイントとなるファイルの冒頭に設計ドキュメントへの参照コメントを入れる。
5. **整合性を維持する**: 実装完了後、設計反映（`docs/spec/`の上書き・`docs/ddr/`への記録・
   `worklog/`削除・`HANDOFF.md`リセット）を行ってからPRを作成する。

TypeScript/VS Code拡張のコーディング規約・ディレクトリ構成が決まり次第、上記を具体的な手順として
書き起こすこと。
