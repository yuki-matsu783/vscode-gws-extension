---
title: Repository Map
type: guide
description: プロジェクトルートから各ディレクトリへの相対パスと役割をまとめたリポジトリマップ
tags: [index, repository-map, guide]
keywords: [directory, repository-map, リポジトリマップ, ディレクトリ, docs, dev-tools, claude, plans, worklog]
---

# Repository Map

`vscode-gws-extension` リポジトリの主要ディレクトリの一覧。**各ディレクトリの役割説明は本ファイルを
正とし**、ファイル単位の詳細は記載しない（重複を避けるため）。ディレクトリツリー構造・配置ルール・
個別ファイルの役割は [.claude/rules/directory-structure.md](.claude/rules/directory-structure.md) を、
ドキュメントの置き場所・ライフサイクルは [.claude/rules/docs-workflow.md](.claude/rules/docs-workflow.md) を参照。

着手時点ではソースコードが存在せず、以下は開発フロー・ドキュメント・AI資産に関するディレクトリの
みを説明する。拡張本体（VS Code拡張、TypeScript/React Webview想定）の`src/`等のレイアウトは未確定
（`.claude/rules/directory-structure.md`のTODO節参照）。決まり次第この節を追記すること。

## Directory Structure

- [./docs/](./docs/) 拡張本体の設計ドキュメント。
  - [./docs/spec/](./docs/spec/) 機能ごとの正史仕様（最新の仕様を上書き更新）。現時点では未実装のため空。
  - [./docs/ddr/](./docs/ddr/) 意思決定ログ（DDR: Design Decision Record。追記のみ）。
- [./dev-tools/](./dev-tools/) 開発者向けツール一式。アプリ本体（`docs/`）とは分離して管理する。
  - [./dev-tools/src/](./dev-tools/src/) issue駆動MRワークフロー支援スクリプト等（bash）。
    - [./dev-tools/src/vcs/](./dev-tools/src/vcs/) GitHub/GitLabの差異を吸収するVCS抽象化層（`Provider.sh`）。
  - [./dev-tools/docs/](./dev-tools/docs/) dev-tools機能の設計ドキュメント。
    - [./dev-tools/docs/spec/](./dev-tools/docs/spec/) dev-tools機能ごとの正史仕様。
    - [./dev-tools/docs/ddr/](./dev-tools/docs/ddr/) dev-tools関連の意思決定ログ。
- [./tests/](./tests/) `dev-tools/`配下のbashスクリプトに対する単体テスト。
- [./.claude/](./.claude/) Claude Code向けのルール・スキル・エージェント・hook定義一式。
  - [./.claude/rules/](./.claude/rules/) AI向け詳細ルール（ディレクトリ構成・ドキュメント運用・シェルスクリプト規約等）。
  - [./.claude/skills/](./.claude/skills/) `issue-mr-flow`（唯一の実装フロー定義）・`vscode-extension-implement`（TODOスタブ）などのスキル定義。
  - [./.claude/agents/](./.claude/agents/) サブエージェント定義（コードレビュー・issue-mr-flow途中引き継ぎ等）。
  - [./.claude/hooks/](./.claude/hooks/) SessionStart/PostToolUse等のClaude Code hookスクリプト。
    - [./.claude/hooks/lib/](./.claude/hooks/lib/) 複数hookスクリプトで使い回す共通ロジック。
  - [./.claude/scripts/](./.claude/scripts/) 現状未使用のプレースホルダー。
  - [./.claude/usage-state/](./.claude/usage-state/) hookが生成するephemeralな使用量状態（`.gitignore`対象）。
- [./.gemini/](./.gemini/) Gemini CLI向け設定（`settings.json`）。
- [./plans/](./plans/) AIエージェントのplanモードが出力する計画ファイル。タスクごとに新規生成しそのままコミットして履歴として残す。
- [./worklog/](./worklog/) 実装中の詳細な試行錯誤ログ（`日付_<planファイル名>.md`）。PR作成前の設計反映でspec/ddrへ反映し削除する。
- [./.github/ISSUE_TEMPLATE/](./.github/ISSUE_TEMPLATE/) GitHub用issueテンプレート（目的・現状・期待する動作・受け入れ条件）。
- [./.gitlab/issue_templates/](./.gitlab/issue_templates/) GitLab用issueテンプレート（同上）。本リポジトリはGitLabリモートを使わないため現状未配置。
- [./参考ディレクトリ/](./参考ディレクトリ/) 設計・実装の参考にするため作業者がローカルへcloneした外部プロジェクト。`.gitignore`対象・参照専用（コミット対象に含めない）。
