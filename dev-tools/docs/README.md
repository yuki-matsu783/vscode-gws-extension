---
title: dev-tools/docs配下の目次
type: guide
description: dev-tools配下（開発者向けツール一式）のspec・ddrの位置づけと各ドキュメントへのリンクをまとめた目次
tags: [dev-tools, docs, index, guide]
keywords: [正史仕様, 意思決定ログ, issue-mr-workflow, シェルスクリプト方針, frontmatter抽出]
---

# dev-tools/docs 配下の目次

`dev-tools/` は開発者向けツール（issue駆動MRワークフロー支援・frontmatter抽出等）一式を、
アプリ本体（拡張本体のソース・`docs/`）とは分離して管理するディレクトリ。開発フロー全体は
[.claude/skills/issue-mr-flow/SKILL.md](../../.claude/skills/issue-mr-flow/SKILL.md)
（唯一の実装フロー定義）に従い、ドキュメントの置き場所・ライフサイクルは
[.claude/rules/docs-workflow.md](../../.claude/rules/docs-workflow.md) の「ドキュメント運用」表を参照する。

- `spec/` ── dev-tools機能ごとの正史仕様（最新の仕様を上書き更新）
- `ddr/` ── dev-tools関連の意思決定ログ（DDR: Design Decision Record。追記のみ）

なお `.gitlab/issue_templates/` は本リポジトリがGitLabリモートを使わないため現状未配置としている
（`dev-tools/src/vcs/` のGitHub/GitLab両対応とは非対称になるが、意図的な選択である。GitLabリモートを
使い始める場合に追加する）。

## spec（機能仕様）

- [issue-mr-workflow.md](spec/issue-mr-workflow.md) ── issue駆動MRワークフロー支援
- [shell-scripts.md](spec/shell-scripts.md) ── 開発補助スクリプトのシェル言語方針（bash）
- [extract-frontmatter.md](spec/extract-frontmatter.md) ── frontmatter抽出スクリプト（index.jsonl生成）

## ddr（意思決定ログ）

DDR（Design Decision Record）はADR（Architecture Decision Record）の考え方を拡張し、
architectureに限らない意思決定も記録対象とする（詳細は
[docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)参照）。

現時点でdev-tools固有のDDRは記録されていません。
