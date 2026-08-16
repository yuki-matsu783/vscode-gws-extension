---
title: tests/
type: guide
description: 手動/自動テスト用スクリプトの一覧と、各スクリプトの対象・副作用・実行方法をまとめたガイド
tags: [tests, guide]
keywords: [bashテスト, アサーション, vcs-provider, 単体テスト, frontmatter, usage-tracking]
---

# tests/

手動/自動テスト用スクリプトを置くディレクトリ（`CLAUDE.md` 参照）。機能の動作確認に使った
スクリプトは使い捨てにせず、ここに残して再実行できるようにする。

## 一覧

| ファイル | 対象 | 副作用 | 実行方法 |
|---|---|---|---|
| `test_vcs_provider.sh` | `dev-tools/src/vcs/Provider.sh`のうち、gh/glab呼び出しを伴わない純粋ロジック（`to_slug`・`test_issue_sections`・`get_issue_number_from_branch`） | なし。アサーション結果を標準出力する | `bash tests/test_vcs_provider.sh`（git bash） |
| `test_extract_frontmatter.sh` | `dev-tools/src/extract-frontmatter.sh`のうち、find/stat呼び出しを伴わない純粋ロジック（`frontmatter_to_json`のYAML→JSON変換、concept_id/directoryの導出） | あり（`$TMPDIR`配下に一時ファイルを作成・削除するのみ） | `bash tests/test_extract_frontmatter.sh`（git bash） |
| `test_archive_reentrant_plan.sh` | `dev-tools/src/archive-reentrant-plan.sh`（Planモード再突入時のファイル退避ロジック） | あり（`$TMPDIR`配下に一時ディレクトリを作成・削除するのみ） | `bash tests/test_archive_reentrant_plan.sh`（git bash） |
| `test_usage_tracking.sh` | `.claude/hooks/lib/UsageTracking.sh`の純粋ロジック（`_usage_aggregate_transcript`のgapベースの稼働時間`activeSeconds`算出、`_usage_merge_state`の累計差分計算） | あり（`$TMPDIR`配下に合成JSONLフィクスチャを作成・削除するのみ） | `bash tests/test_usage_tracking.sh`（git bash） |

## 実行結果の見方

いずれも最後に `passed=<成功数> failures=<失敗数>` を出力し、失敗が1件でもあれば終了コード1を返す。
個別の失敗は `FAIL: <ラベル> expected=[...] actual=[...]` 形式で出力される。

## 新しい機能を追加したとき

拡張本体（VS Code拡張のTypeScriptコード等）のテストフレームワーク・配置ルールは未確定
（`.claude/rules/directory-structure.md` のTODO節参照）。上記4本のような、dev-tools配下の
bashスクリプトに対する単体テストを追加する場合は、既存ファイルと同じ形式（`assert_equal`等の
簡易アサーション関数、`passed=N failures=N`の出力、失敗時終了コード1）に倣う。
