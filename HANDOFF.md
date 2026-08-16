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
| [x] | 6 | commit, push してレビュー依頼を行う | エージェント |
| [x] | 7 | MRで再度planについてレビュー・コメントする。レビュー完了済み連絡をするまで以降の作業は行わない。 | 人間 |
| [x] | 8 | レビュー内容を取得し、planを修正する。対応が完了したコメントには対応内容を返信する（7〜8を合意まで繰り返す） | `comments` / `reply` |
| [x] | 9 | planをもとにMR descriptionを更新する | `describe` |
| [] | 10 | コンテキスト削減のためにセッションをcompactする | 人間 |
| [x] | 11 | planをもとに作業を進める、作業内容はworklogに更新する | エージェント |
| [x] | 12 | commit, push してレビュー依頼を行う | エージェント |
| [x] | 13 | 作業内容をもとにMR descriptionを更新する | `describe` |
| [x] | 14 | MRでレビュー・コメントする | 人間 |
| [x] | 15 | レビュー内容を取得し、実装・ドキュメントを修正する。対応が完了したコメントには対応内容を返信する（11〜15の作業ループを合意まで繰り返す） | `comments` / `reply` |
| [x] | 16 | 設計反映: `plans/` `worklog/` の内容を `docs/spec/` `docs/ddr/` へ反映する | エージェント |
| [x] | 17 | AIアセット改善: 作業中に気づいたルール・スキルの不備があれば `.claude/rules/` `.claude/skills/` `CLAUDE.md` `AGENTS.md` に反映する | エージェント |
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
  絞ることをユーザーと合意し、Planを`plans/smooth-sauteeing-sunbeam.md`へ出力・承認済み（レビューOK確認済み）。
- `yo code . -t=ts --pkgManager=npm --gitInit=false -q` で雛形を生成（`--gitInit=false`が効かず
  `.gitignore`衝突プロンプトで中断したが、他の生成物は書き込み済みだったため再実行はせず、
  `.gitignore`への手動追記＋`npm install`で完結。詳細:
  `worklog/20260816_smooth-sauteeing-sunbeam.md`）。
- `tsconfig.json`に`参考ディレクトリ/`を`exclude`追加し`npm run compile` / `npm run lint`成功を確認。
- `.claude/rules/directory-structure.md`, `DEVELOPERS.md`, `index.md`のTODOを実態に合わせて更新。
- ユーザー報告のF5デバッグ起動タイムアウトを`--disable-extensions`でのデバッガ無し起動により切り分け、
  拡張自体（Hello World通知表示）は正常動作することを確認（コード変更は不要と判断）。
- Plan/worklogの内容を`docs/ddr/0002-yo-codeでTypeScript拡張機能の雛形を作成する.md`へ設計反映。

## 次にやること

- flow-id 18: 設計反映（DDR 0002追加）をcommit・pushし、PR上でレビュー依頼を行う。
- レビュー合意（flow-id 19〜20）後、flow-id 21（plans/worklog削除・HANDOFF.mdリセット）〜23
  （Draft解除・マージ。マージは人間が実施）へ進む。

## 判断を迷った内容

- `yo code . -t=ts`実行時に生成される`README.md`が既存の全体アーキテクチャ説明README.mdと
  衝突する問題。「事前退避→生成後に既存版を復元」で対応する方針だったが、実際には
  `.gitignore`衝突でプロセスが先に中断したためREADME.mdへは到達せず、退避したファイルは
  結果的に不要だった（詳細: `plans/smooth-sauteeing-sunbeam.md`, worklog）。

## 未解決の内容

- issue #2本文が標準4見出し（目的/現状/期待する動作/受け入れ条件）未使用（VS Code公式ガイドへの
  リンクのみ）だった旨をユーザーに警告済み。処理は続行しているが、受け入れ条件は今回のPlanでの
  スコープ確認内容（`plans/smooth-sauteeing-sunbeam.md`）で代替している。
- `.claude/skills/vscode-extension-implement/SKILL.md` /
  `.claude/agents/vscode-extension-code-reviewer.md` のTODOは本issueのスコープ外。コーディング規約が
  固まってきた次issue以降で解消する。
- `--gitInit=false`がyargsの仕様上効かない可能性がある件（worklog参照）。将来同種のスクリプトを
  再実行する場合は`--no-gitInit`を使うこと。

## 守るべき条件・触ってはいけない範囲

- `docs/ddr/*.md` は原則追記のみ（変更不可）。
