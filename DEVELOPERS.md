---
title: 開発者向けドキュメント
type: guide
description: vscode-gws-extensionの開発に参加する人向けの動作環境・関連ドキュメントへの入り口をまとめたガイド
tags: [developers, guide]
keywords: [vscode拡張, typescript, ディレクトリ構成, 正史仕様, issue-mr-flow, ビルド, リリース手順]
---

# 開発者向けドキュメント

`vscode-gws-extension` の開発に参加する人向けのドキュメント。プロジェクト概要は
[AGENTS.md](AGENTS.md)、コーディング規約・ディレクトリ構成などの詳細ルールは
[.claude/rules/](.claude/rules/) 配下を参照。

## 動作環境

**TODO**: 拡張本体（VS Code拡張、TypeScript/React Webview）のソースコードがまだ存在しないため未確定。
実装着手時にNode.js/npmのバージョン等をここに記載する。

## ソースから実行する

**TODO**: ソースコード未着手のため未確定。

## ディレクトリ構成

詳細は [.claude/rules/directory-structure.md](.claude/rules/directory-structure.md) を参照
（現時点では開発フロー・ドキュメント・AI資産に関するメタ構成のみが決まっており、拡張本体の
`src/`レイアウトはTODOのまま）。

主な機能とその正史仕様（`docs/spec/`）は [docs/README.md](docs/README.md) を参照
（現時点では未実装のため登録なし）。

## 実装フロー

新機能の追加や既存動作の変更を行う前に、必ずissueの起票→設計ドキュメント作成→人間の承認→
（必要に応じて）planモードでの合意→実装、という手順を踏む。詳細は
[.claude/skills/issue-mr-flow/SKILL.md](.claude/skills/issue-mr-flow/SKILL.md)（唯一の実装フロー定義）を参照
（拡張本体の実装部分は `.claude/skills/vscode-extension-implement/SKILL.md` として手順化する想定だが、
現時点ではTODOスタブ）。

## テスト

`tests/` 配下に、`dev-tools/`配下のbashスクリプトに対する単体テストがある。一覧・実行方法は
[tests/README.md](tests/README.md) を参照。拡張本体のテストフレームワーク・配置ルールは未確定。

## ビルド

**TODO**: `vsce package`等によるパッケージング方針は未確定。

## リリース時の手順

**TODO**: 配布方法（Marketplace公開／内部配布等）は未確定。

## 未整備・今後整理する点

- 拡張本体（`src/`等）のディレクトリ構成・コーディング規約・ビルド／パッケージング／リリース手順は
  すべて未確定（`.claude/rules/directory-structure.md`のTODO節参照）。
- 実装着手時に、本ファイルの各TODO節・`.claude/skills/vscode-extension-implement/SKILL.md`・
  `.claude/agents/vscode-extension-code-reviewer.md`を合わせて整備すること。
