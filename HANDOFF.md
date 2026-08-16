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

- issue #6（reactで左サイドバーのwebviewサンプルを作成する）を起点に着手。issue本文はテンプレートのまま
  未記入だったため、ユーザーへ目的・技術構成をヒアリングした。
  - 目的: サイドバーに表示するReact Webviewサンプルに、何かアクションを起こすボタンを置き、
    右クリックメニューから外部送信（issue #4で作った `POST /analyze` 相当の仕組み）につなげられる
    ようにしたい、とのこと。
  - 技術構成（ビルドツール・`src/webview/`配下の構成等）はエージェントに一任。
- `feature-6-react-webview` ブランチをmainから作成・push。
- Draft PR [#8](https://github.com/yuki-matsu783/vscode-gws-extension/pull/8) を作成
  （初回作成時は「No commits between main and feature-6-react-webview」で失敗したが、
  `Provider.sh`内の空コミットによる自動リトライで成功）。

- Plan（`plans/imperative-purring-tarjan.md`）を作成しユーザー承認を得た。概要:
  `src/webview/`を新設しesbuildでReactをバンドル、`WebviewViewProvider`からサイドバーに表示、
  ボタン押下で既存の`vscode-gws-extension.sendFileToApi`コマンドを`executeCommand`で呼び出す
  （fetch実装は再利用し二重実装しない）。
- `worklog/20260816_imperative-purring-tarjan.md` を作成した。

## 次にやること

- flow-id 6: plan/worklog/HANDOFFをcommit・push。`describe`でPR descriptionを更新し、
  人間のplanレビュー（flow-id 7）を待つ。

## 判断を迷った内容

（なし）

## 未解決の内容

- `.claude/skills/vscode-extension-implement/SKILL.md` / `.claude/agents/vscode-extension-code-reviewer.md`
  のTODO（TypeScriptコーディング規約・コードレビュー観点の正式策定）が引き続き残っている。issue #4対応で
  実装知見の暫定メモは追記したが、本格的な規約化はまだ先送り中（経緯:
  [docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。
  React Webview追加などの次の実装issueで着手する。
- issue #4で定めたPython API側のエンドポイント契約（`POST /analyze`, body `{ path }`）は本リポジトリ側の
  仮定義（[docs/ddr/0003](../docs/ddr/0003-右クリックメニューから外部APIへ送るサンプルのコントラクトを決める.md)参照）。
  Python API実装リポジトリ側との正式なすり合わせは未実施。

## 守るべき条件・触ってはいけない範囲

- `docs/ddr/*.md` は原則追記のみ（変更不可）。
