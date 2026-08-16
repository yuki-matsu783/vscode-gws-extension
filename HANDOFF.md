---
title: HANDOFF
type: handoff
description: セッション間・作業者間の引継ぎメモ（現在地・次回やること等）
tags: [handoff, workflow]
keywords: [フロー進捗, worklog, 引き継ぎ, plan, レビュー]
---

# HANDOFF

<!--
AI⇔AI/AI⇔人間の状況引継ぎメモ。常に「このブランチの現状」を表現する
-->

## フロー進捗状況

| 進捗 | flow-id | ステップ | 担当 |
|----|---|---|---|
| [x] | 1 | issueを起票する（`.github/ISSUE_TEMPLATE/task.md` / `.gitlab/issue_templates/task.md` で目的・現状・期待する動作・受け入れ条件を記載） | 人間 |
| [x] | 2 | issueの内容を取得する | `start <issue番号>` |
| [x] | 3 | featureブランチ（`feature-<issue番号>-<slug>`）とDraft MRを作成する（既にあれば `sync` のみ） | `start` |
| [x] | 4 | Planモードで実行手順を作成する（`plans/` へ出力・コミット。このタイミングで `worklog/日付_<plan名>.md` を作成） | エージェント |
| [x] | 5 | Planに合意する | 人間 |
| [] | 6 | commit, push してレビュー依頼を行う | エージェント |
| [] | 7 | MRで再度planについてレビュー・コメントする。レビュー完了済み連絡をするまで以降の作業は行わない。 | 人間 |
| [] | 8 | レビュー内容を取得し、planを修正する。対応が完了したコメントには対応内容を返信する（7〜8を合意まで繰り返す） | `comments` / `reply` |
| [] | 9 | planをもとにMR descriptionを更新する | `describe` |
| [] | 10 | コンテキスト削減のためにセッションをcompactする | 人間 |
| [] | 11 | planをもとに作業を進める、作業内容はworklogに更新する | エージェント |
| [] | 12 | commit, push してレビュー依頼を行う | エージェント |
| [] | 13 | 作業内容をもとにMR descriptionを更新する | `describe` |
| [] | 14 | MRでレビュー・コメントする | 人間 |
| [] | 15 | レビュー内容を取得し、実装・ドキュメントを修正する。対応が完了したコメントには対応内容を返信する（11〜15の作業ループを合意まで繰り返す） | `comments` / `reply` |
| [] | 16 | 設計反映: `plans/` `worklog/` の内容を `docs/spec/` `docs/ddr/` へ反映する | エージェント |
| [] | 17 | AIアセット改善: 作業中に気づいたルール・スキルの不備があれば `.claude/rules/` `.claude/skills/` `CLAUDE.md` `AGENTS.md` に反映する | エージェント |
| [] | 18 | commit, push してレビュー依頼を行う | エージェント |
| [] | 19 | MRでレビュー・コメントする | 人間 |
| [] | 20 | レビュー内容を取得し、設計反映・AIアセットの内容を修正する。対応が完了したコメントには対応内容を返信する（16〜20を合意まで繰り返す） | `comments` / `reply` |
| [] | 21 | `plans/` `worklog/` を削除し、`HANDOFF.md` を次タスクへリセットする | エージェント |
| [] | 22 | commit, push して Draftを解除する | エージェント |
| [] | 23 | マージする（squash merge。ブランチは削除してよい） | 人間 |

## やったこと

- issue #2「VSCODEの拡張機能を作成するためのfirst stepを行う」を起点に、ブランチ
  `feature-2-vscode-first-step` とDraft PR [#3](https://github.com/yuki-matsu783/vscode-gws-extension/pull/3) を作成した。
- スコープを「`yo code`（generator-code）でのTypeScript拡張機能の雛形作成〜F5デバッグ起動確認まで」に
  絞ることをユーザーと合意し、Planを`plans/smooth-sauteeing-sunbeam.md`へ出力・承認済み。
  worklogは`worklog/20260816_smooth-sauteeing-sunbeam.md`。

## 次にやること

- flow-id 6: plan/worklogをcommit・pushし、PR上でレビュー依頼を行う。
- レビュー合意（flow-id 7〜9）後、flow-id 11以降で実際に`yo code`を実行し、生成物確認・
  `.gitignore`追記・`.claude/rules/directory-structure.md`と`DEVELOPERS.md`のTODO解消を行う。

## 判断を迷った内容

- `yo code . -t=ts`実行時に生成される`README.md`が既存の全体アーキテクチャ説明README.mdと
  衝突する問題。「事前退避→生成後に既存版を復元」で対応する方針をユーザーと合意済み
  （詳細: `plans/smooth-sauteeing-sunbeam.md`）。

## 未解決の内容

- issue #2本文が標準4見出し（目的/現状/期待する動作/受け入れ条件）未使用（VS Code公式ガイドへの
  リンクのみ）だった旨をユーザーに警告済み。処理は続行しているが、受け入れ条件は今回のPlanでの
  スコープ確認内容（`plans/smooth-sauteeing-sunbeam.md`）で代替している。
- `.claude/skills/vscode-extension-implement/SKILL.md` /
  `.claude/agents/vscode-extension-code-reviewer.md` のTODOは本issueのスコープ外。コーディング規約が
  固まってきた次issue以降で解消する。

## 守るべき条件・触ってはいけない範囲

- `docs/ddr/*.md` は原則追記のみ（変更不可）。
