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
| [] | 7 | MRで再度planについてレビュー・コメントする。レビュー完了済み連絡をするまで以降の作業は行わない。 | 人間 |
| [] | 8 | レビュー内容を取得し、planを修正する。対応が完了したコメントには対応内容を返信する（7〜8を合意まで繰り返す） | `comments` / `reply` |
| [] | 9 | planをもとにMR descriptionを更新する | `describe` |
| [] | 10 | コンテキスト削減のためにセッションをcompactする | 人間 |
| [x] | 11 | planをもとに作業を進める、作業内容はworklogに更新する | エージェント |
| [x] | 12 | commit, push してレビュー依頼を行う | エージェント |
| [x] | 13 | 作業内容をもとにMR descriptionを更新する | `describe` |
| [x] | 14 | MRでレビュー・コメントする | 人間 |
| [x] | 15 | レビュー内容を取得し、実装・ドキュメントを修正する。対応が完了したコメントには対応内容を返信する（11〜15の作業ループを合意まで繰り返す） | `comments` / `reply` |
| [x] | 16 | 設計反映: `plans/` `worklog/` の内容を `docs/spec/` `docs/ddr/` へ反映する | エージェント |
| [x] | 17 | AIアセット改善: 作業中に気づいたルール・スキルの不備があれば `.claude/rules/` `.claude/skills/` `CLAUDE.md` `AGENTS.md` に反映する | エージェント |
| [x] | 18 | commit, push してレビュー依頼を行う | エージェント |
| [] | 19 | MRでレビュー・コメントする | 人間 |
| [] | 20 | レビュー内容を取得し、設計反映・AIアセットの内容を修正する。対応が完了したコメントには対応内容を返信する（16〜20を合意まで繰り返す） | `comments` / `reply` |
| [] | 21 | `plans/` `worklog/` を削除し、`HANDOFF.md` を次タスクへリセットする | エージェント |
| [] | 22 | commit, push して Draftを解除する | エージェント |
| [] | 23 | マージする（squash merge。ブランチは削除してよい） | 人間 |

## やったこと

- issue #4「右クリックのコンテキストメニューを追加し、外部APIに向けてリクエストを送る機能のサンプルを
  作成する」に対し、ブランチ `feature-4-api` / Draft PR #5 を作成。
- issue本文が空だったため人間に確認し、外部API=README記載のPython API(FastAPI)想定、
  コンテキストメニューはエディタ・エクスプローラー両方、リクエストは選択ファイルパスのPOST送信サンプル、
  API URLはVS Code設定で持たせる、という前提を確定してPlanを作成・承認（`plans/zazzy-foraging-meerkat.md`）。
- `package.json`（commands/menus/configuration追加）・`src/extension.ts`（`sendFileToApi`コマンド実装）・
  `src/test/extension.test.ts`（コマンド登録テスト追加）を実装し、compile/lint/testすべて成功を確認。
- commit・push・PR #5 description更新まで完了。

- 「レビュー済み」の合図を受けて `comments all` で未解決コメントを再確認 → 0件（自動投稿の
  対応工数レポートのみ、formalレビューも無し）だったため、設計反映（flow-id 16〜17）に進んだ。
- `docs/spec/右クリックで外部APIへリクエストを送信する.md`（初のspec）、
  `docs/ddr/0003-右クリックメニューから外部APIへ送るサンプルのコントラクトを決める.md` を作成し、
  `docs/README.md`の目次・`docs/`配下の`index.jsonl`を更新。
- `.claude/skills/vscode-extension-implement/SKILL.md`（TODOプレースホルダー）に、コマンド登録
  テストで`activate()`が必要になる等の実装知見を暫定メモとして追記（TODOステータス自体は維持）。
- commit・push・PR description更新まで完了。

## 次にやること

- PR #5 の設計反映後レビュー（flow-id 19）待ち。レビューコメントが付いたら
  `/issue-mr-flow comments` で取得し対応する。
- F5でのExtension Development Host起動による目視確認（コンテキストメニュー表示・Python API未起動時の
  エラーメッセージ表示）は未実施のため、レビュー前後いずれかのタイミングで実施が望ましい。
- レビュー完了後、flow-id 21（`plans/` `worklog/` 削除・HANDOFF.mdリセット）→ 22（Draft解除）へ進む。

## 判断を迷った内容

- flow-id 6〜10（plan単独でのMRレビュー往復）を独立して行わず、Planモード内での人間承認（flow-id 5）を
  もって直ちに実装（flow-id 11〜13）へ進み、plan・worklog・実装をまとめて1コミットでpush、PR description
  も実装状況まで含めて一度に更新した。plan自体の複雑さが低く、Planモードでの承認を得ていたため効率を優先。
  次のレビュー（flow-id 14）でplanと実装の両方がまとめてレビュー対象になる点は把握しておくこと。

## 未解決の内容

- issue #2の後続として、`.claude/skills/vscode-extension-implement/SKILL.md` /
  `.claude/agents/vscode-extension-code-reviewer.md` のTODO（TypeScriptコーディング規約・
  コードレビュー観点の策定）が残っている。React Webview追加などの次の実装issueで着手する。
- issue #4のPython API側エンドポイント契約（`POST /analyze`, body `{ path }`）は本リポジトリ側で
  仮に定めたもの。Python API実装リポジトリ側との正式なすり合わせは未実施。

## 守るべき条件・触ってはいけない範囲

- `docs/ddr/*.md` は原則追記のみ（変更不可）。
