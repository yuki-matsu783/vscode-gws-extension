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

- issue #7を取得。本文の4見出しは存在するが中身は未記入（プレースホルダのまま）だったため、
  ユーザーに確認し「issue #6のパターンをそのまま踏襲した最小サンプル」として進める方針で合意。
- `feature-7-react-webview`ブランチ・Draft PR [#9](https://github.com/yuki-matsu783/vscode-gws-extension/pull/9)を作成。
- Plan作成: `plans/floofy-splashing-sparrow.md`（`vscode.window.createWebviewPanel`を使った
  `EditorPanelProvider`の新規実装、`getWebviewHtml.ts`共通化、esbuild複数entry point化 等）。
  ユーザー承認済み。worklog: `worklog/20260817_floofy-splashing-sparrow.md`。
- planレビュー完了（未解決スレッド0件）、PR [#9](https://github.com/yuki-matsu783/vscode-gws-extension/pull/9)のdescriptionをplan内容で更新。
- plan通りに実装完了: `esbuild.js`複数entry point化、`src/webview/getWebviewHtml.ts`新設・
  `SidebarViewProvider.ts`をこれに置き換え、`EditorApp.tsx`/`editorPanelIndex.tsx`/
  `EditorPanelProvider.ts`新規作成、`extension.ts`にコマンド`vscode-gws-extension.openEditorPanel`登録、
  `package.json`の`contributes.commands`追加、`extension.test.ts`にアサーション追加。
  `npm run compile`/`lint`/`test`（3件）すべてパス。一時テストで実際にExtension Development Host上
  からパネルオープン・シングルトン動作（2回目実行でreveal）を検証済み（検証後に一時ファイルは削除）。

## 次にやること

- 実装差分をcommit・pushしてレビュー依頼（フローステップ12）、その後PR descriptionを実装内容で
  更新（フローステップ13）。

## 判断を迷った内容

（なし）

## 未解決の内容

- issue #4で定めたPython API側のエンドポイント契約（`POST /analyze`, body `{ path }`）は本リポジトリ側の
  仮定義（[docs/ddr/0003](../docs/ddr/0003-右クリックメニューから外部APIへ送るサンプルのコントラクトを決める.md)参照）。
  Python API実装リポジトリ側との正式なすり合わせは未実施。

## 守るべき条件・触ってはいけない範囲

- `docs/ddr/*.md` は原則追記のみ（変更不可）。
