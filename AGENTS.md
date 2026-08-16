---
title: AIエージェント共通ルール
type: rule
description: 複数のAIコーディングエージェント（Claude Code, Gemini CLI等）が共通で従うルール・プロジェクト概要・開発実行方法
tags: [agents, rule]
keywords: [issue-mr-flow, 計画, vscode拡張, typescript, claude-code, gemini-cli]
---

## ルール

- 開発フロー全体（issueの起票〜マージ）は `.claude/skills/issue-mr-flow/SKILL.md` を参照する
  （唯一の実装フロー定義）。ごく小さな変更を除き、全タスクはissueを起点に進める。
- いかなるタスク（調査、設計、コード作成、テスト、リファクタリングなど）も、**実作業を開始する前に必ず「計画（Plan）」を立ててユーザーに提示**する
- 計画はplansディレクトリ配下にセッション単位で保存する
- 計画がユーザーに承認（Approve）されるまで、ファイルの書き換えやコマンドの実行を行ってはいけない
- コーディング規約・ディレクトリ構成・ドキュメント運用などの詳細ルールは `.claude/rules/` 配下を参照する

## プロジェクト概要

`vscode-gws-extension` は、VS Code拡張（React Webview + TypeScript）をフロントエンドに、
ローカルのPython API（FastAPI）をバックエンドに、ユーザーのChromeをPlaywrightで操作して
NotebookLMと連携する、というシステム全体（詳細は [README.md](README.md) 参照）のうち、
**VS Code拡張部分のみ**を管理するリポジトリです。Python API・Playwright自動化・Chrome連携の
部分は別リポジトリの管轄であり、本リポジトリのスコープ外です。

着手時点ではソースコードは存在せず、開発フロー・ディレクトリ構成・AI開発資産（本ファイルや
`.claude/`配下）を先行して整備している段階です（経緯:
[docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 開発・実行

拡張本体のソースコード・ビルド／実行方法は未確定です。詳細は [DEVELOPERS.md](DEVELOPERS.md) を
参照してください（該当節は現時点でTODOのままです）。
