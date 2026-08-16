---
title: docs配下の目次
type: guide
description: docs/spec・docs/ddrの位置づけと各ドキュメントへのリンクをまとめた目次
tags: [docs, index, guide]
keywords: [正史仕様, 意思決定ログ, ddr, spec, vscode拡張]
---

# docs 配下の目次

`vscode-gws-extension` の開発フロー全体は [.claude/skills/issue-mr-flow/SKILL.md](../.claude/skills/issue-mr-flow/SKILL.md)
（唯一の実装フロー定義）、ドキュメントの置き場所・ライフサイクルは
[.claude/rules/docs-workflow.md](../.claude/rules/docs-workflow.md) の「ドキュメント運用」表を参照。

- `spec/` ── 機能ごとの正史仕様（最新の仕様を上書き更新）
- `ddr/` ── 過去の設計決断のログ（DDR: Design Decision Record。追記のみ・変更不可）

なお、開発ツール（`dev-tools/`）自体に関する仕様・意思決定は `dev-tools/docs/spec/`・`dev-tools/docs/ddr/`
に分けて管理する（`.mrworkflow.json` の `specDirs`/`ddrDirs` 参照）。本ディレクトリ配下は拡張本体
（アプリケーション）に関するドキュメントを対象とする。

## spec（機能仕様）

- [右クリックで外部APIへリクエストを送信する（サンプル）.md](spec/右クリックで外部APIへリクエストを送信する.md) ── issue #4対応。エディタ/エクスプローラーの右クリックメニューからローカルPython API(FastAPI)へファイルパスをPOST送信するサンプルコマンドの仕様

新しい機能を実装したら `spec/<機能名>.md` を追加し、ここにリンクを追記してください（章立ては既存specに倣う:
背景・目的／仕様／影響範囲／設定項目／未決定事項・懸念点）。

## ddr（意思決定ログ）

DDR（Design Decision Record）はADR（Architecture Decision Record）の考え方を拡張し、
architectureに限らない意思決定（運用ルールの決定等）も記録対象とする。

- [0001-参考プロジェクトからAI開発資産を移植.md](ddr/0001-参考プロジェクトからAI開発資産を移植.md) ── 本リポジトリのAI開発資産・ディレクトリ構成を整備した経緯
- [0002-yo-codeでTypeScript拡張機能の雛形を作成する.md](ddr/0002-yo-codeでTypeScript拡張機能の雛形を作成する.md) ── issue #2対応。yo code（generator-code）による拡張本体の雛形作成方針
- [0003-右クリックメニューから外部APIへ送るサンプルのコントラクトを決める.md](ddr/0003-右クリックメニューから外部APIへ送るサンプルのコントラクトを決める.md) ── issue #4対応。サンプル実装のリクエスト内容・API URL決定方式・メニュー配置の決定
