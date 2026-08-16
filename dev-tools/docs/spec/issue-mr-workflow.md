---
title: issue駆動MRワークフロー支援
type: spec
description: AIエージェントがissue起点で開発を進める際の定型作業（issue取得・ブランチ/MR作成・レビュー往復等）を支援する仕組みの仕様
tags: [issue-mr-flow, workflow, spec]
keywords: [provider-sh, github連携, gitlab連携, セッション開始hook, 使用量集計, draft-pr, 途中引き継ぎ]
---

# issue駆動MRワークフロー支援

## 背景・目的

AIエージェント（Claude Code）がissueを起点に開発を進める際、以下の定型作業を毎回人手で組み立てているとコストが高い。

- issueの内容取得
- ブランチ・MR（Pull Request / Merge Request）の作成
- plan〜レビュー往復（人間のコメント取得→plan修正）の繰り返し
- 作業内容に応じたMR descriptionの更新
- 設計反映（`plans/` `worklog/` の内容を `docs/spec/` `docs/ddr/` へ反映）後のクリーンアップ

これをGitHub・GitLabどちらのリポジトリでも同じ手順で回せるように、ステップ単位で呼び出す
Claude Codeスキルと、その裏側でGitHub/GitLabの差異を吸収するスクリプト群を整備する。

`.claude/skills/issue-mr-flow/SKILL.md` を**唯一の実装フロー定義**とし、`docs-workflow.md` /
`git-workflow.md` はドキュメントの置き場所・ライフサイクルやブランチ命名規則といった参照情報のみを
持つ（実装フロー本体の重複記載はしない）。今後はごく小さな変更を除くあらゆるタスクをissue起点で
進める前提とする。

なお本仕組み自体は、参考実装（Claude Codeによるissue駆動開発フローが成熟していた別プロジェクト）の
資産を汎用化した上でこのリポジトリへ移植したものである（経緯: [docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 仕様

### 実行モデル

ステップ単位のスラッシュコマンド（Claude Codeスキル）として提供する。常駐エージェントによる
自動ポーリング・自動承認は行わない。各ステップは人間が意図したタイミングで明示的に呼び出す
（「合意まで繰り返す」の終了判定＝レビューを打ち切って次工程に進む判断は、常に人間が行う）。

### コンポーネント構成

```
.mrworkflow.json                    # リポジトリ固有設定（他リポジトリへ移植する際はこれだけ差し替える）
.github/ISSUE_TEMPLATE/
└── task.md                         # GitHub用issueテンプレート（目的・現状・期待する動作・受け入れ条件）
.gitlab/issue_templates/
└── task.md                         # GitLab用issueテンプレート（同上。本リポジトリはGitLabリモートを
                                     #   使わないため現状未配置。GitLabを使い始める場合に追加する）
dev-tools/src/vcs/
├── Provider.sh                     # git remote からGitHub/GitLabを判定し、共通関数をディスパッチ
├── Github.sh                       # gh CLIラッパー
└── Gitlab.sh                       # glab CLIラッパー（未検証。GitLab実remoteが無いため）
.claude/skills/issue-mr-flow/
└── SKILL.md                        # ステップ実行のオーケストレーション手順書
.claude/agents/
└── issue-mr-resume.md              # 途中引き継ぎ用の状態調査サブエージェント（resumeから起動）
.claude/hooks/
├── session-start.sh                 # セッション開始時のissue/MR状態自動注入（SessionStart hook）
├── post-push-usage-report.sh        # git push検知時のトークン使用量集計＋MR自動コメント投稿（PostToolUse hook）
└── lib/
    └── UsageTracking.sh              # 集計ロジック（sync_usage_state）
```

全てbash製（`.sh`）。設計方針・git bash特有の注意点は [shell-scripts.md](shell-scripts.md) を参照。

- **`Provider.sh`**: `git remote get-url origin` のホスト名（`github.com` / `gitlab.*`）でプロバイダを判定し、
  共通インターフェース関数を `Github.sh` / `Gitlab.sh` の対応関数へディスパッチする。呼び出し側
  （スキル・他スクリプト）はプロバイダを意識しない。関数はJSON文字列をstdoutへ出力し、呼び出し側は
  `jq` でフィールドを取り出す設計（例: `get_issue 6 | jq -r '.title'`）。
- **`.mrworkflow.json`**（リポジトリ直下、Git管理下）: ブランチ命名規則やパス（`plans/` 等）など
  プロジェクト固有の値を切り出す。他リポジトリへ移植する場合はこのファイルの値を書き換えるだけで済む
  ようにする。本リポジトリ向けの値は下記「設定項目」に記載。
- **`.claude/skills/issue-mr-flow/SKILL.md`**: issue起票からマージまでの**唯一の実装フロー定義**。
  現在のブランチ・issue番号・`plans/` `worklog/` の有無・MRの有無などから「今どの段階か」を判定し、
  次に何をすべきかをAIエージェントに指示する。実処理は `Provider.sh` 経由のスクリプト呼び出しに
  委譲し、設計ドキュメント作成・plan作成・実装の詳細手順は言語/コンポーネント別の実装スキル
  （例: `.claude/skills/vscode-extension-implement/SKILL.md`。現状はTODOスタブ）に委ねる。

### 提供関数（`Provider.sh` 経由の共通インターフェース）

| 関数 | 内容 | GitHub実装 | GitLab実装 |
|---|---|---|---|
| `get_issue <n>` | issueのtitle/body/labelsを取得（JSON） | `gh issue view` | `glab issue view` |
| `new_issue_branch <n> <title>` | `<branchPrefixTemplate>` に従いブランチを作成しcheckout、リモートpush | `git switch -c` + `git push` | 同左 |
| `new_draft_merge_request <n> <branch> <title> [<base>]` | issueに紐づくDraft PR/MRを作成（bodyは仮テンプレート、後続の `set_mr_description` で上書き前提） | `gh pr create --draft` | `glab mr create --draft` |
| `get_mr_unresolved_comments <n> [true]` | レビューコメント／スレッドを取得しテキストへ整形。既定では未解決のスレッドのみを返し、対応済み（解決済み）スレッドは機械的に除外する。第2引数に `true` を渡すと解決済みも含めた全件を返す | `gh api graphql` (review threads) | `glab api` (discussions) |
| `add_mr_thread_reply <n> <threadId> <text>` | 指定スレッドに対応内容を返信する（スレッドの解決＝resolvedはレビュアー側の操作のため本関数では行わない） | `gh api graphql`（reply mutation） | `glab api`（note追加） |
| `set_mr_description <n> <bodyFile>` | PR/MRのdescriptionを指定ファイル内容で上書き | `gh pr edit --body-file` | `glab mr update --description` |
| `add_mr_comment <n> <bodyFile>` | PR/MRへ新規コメントを1件投稿（スレッド返信・レビューではない通常コメント） | `gh pr comment --body-file` | `glab mr note --message` |
| `sync_branch <branch>` | 現在のブランチをfetch、必要ならcheckout（新しいセッションでの再開用） | `git fetch` + `git checkout` | 同左 |
| `test_issue_sections <body>` | issue本文に「目的／現状／期待する動作／受け入れ条件」の4見出しが揃っているか確認し、欠けている見出し名を1行1件でstdoutへ出力する（プロバイダ非依存） | — | — |
| `get_issue_number_from_branch [<branch>]` | ブランチ名を `branchPrefixTemplate` に照らしてissue番号を抽出する（省略時は現在のブランチ）。マッチすればstdoutへ出力し終了コード0、マッチしなければ終了コード1（プロバイダ非依存） | — | — |
| `get_mr_for_branch <branch>` | 指定ブランチに紐づくPR/MRの番号・URL・タイトル・Draft状態を取得する（JSON。無ければ何も出力せず終了コード0） | `gh pr view <branch>` | `glab mr view <branch>` |
| `get_branch_work_files` | 現在のブランチ固有（`<defaultBaseBranch>` に無い）の `plans/` `worklog/` ファイル一覧を返す（プロバイダ非依存） | — | — |

### 全体フロー

issue起票からマージまでの詳細な手順（担当・順序）は
[.claude/skills/issue-mr-flow/SKILL.md](../../../.claude/skills/issue-mr-flow/SKILL.md)（唯一の実装フロー定義）
に一本化した。本specとの内容重複・ドリフトを避けるため、ここでは表を持たない。

`/issue-mr-flow` のサブコマンドは `start` `comments` `reply` `describe` `sync` `resume` の6つに絞り、
設計ドキュメント作成・plan作成・実装・設計反映・AIアセット改善そのものは
`.claude/skills/issue-mr-flow/SKILL.md` の該当ステップ（言語/コンポーネント別の実装スキルを含む）に
委ねる。

### レビューコメントへの返信

対応が完了したレビューコメントに対して、対応内容を返信する。スレッドの解決（resolved）は
レビュアー側が行う操作のため、本機能では行わない。

- `add_mr_thread_reply <n> <threadId> <text>` で、指定スレッドへ対応内容を
  返信する。`threadId` は `get_mr_unresolved_comments` の出力に含まれるスレッドIDを使う。
- `get_mr_unresolved_comments` は既定（第2引数省略）で未解決スレッドのみを返す（レビュアーが
  解決済みにしたものは機械的に除外される）。再確認等で解決済みも含めた全件が必要な場合は
  第2引数に `true` を指定する。
- `/issue-mr-flow` 側では、`comments` サブコマンドに `all` 引数を追加して `true` を
  指定できるようにし、対応完了時に呼ぶ `reply <threadId> <対応内容>` サブコマンドを新設する。
- **完了合図の確認**: 人間から「レビューOK」等の完了合図を受けても、それだけを根拠に次のステップへ
  進まない。`comments all`（`get_mr_unresolved_comments <n> true`）で全スレッドを再取得し、`unresolved` が残っていれば
  人間に再確認を取ってから次に進む（`reply` は返信のみで解決は行わないため、返信済みでも
  `unresolved` のまま残ることがある）。詳細は `.claude/skills/issue-mr-flow/SKILL.md` の
  「レビュー完了合図の確認」節を参照。

### 途中引き継ぎ対応（resume）

`start <issue番号>` / `sync <branch>` はどちらも「このセッションで既に現在地確認が済んでいる」
ことが前提のコマンドであり、別の人（別セッション）が途中から作業を引き継ぐ場合、AIエージェント
自身が「今どのissue／ブランチ／PRの、どの段階か」を特定する手段が必要になる。`git branch --show-current`
でブランチ名自体は機械的に取得できてしまうため、「情報の既知・未知」を発動条件にすると読み手に
よって解釈がぶれる。そのため発動条件は「このセッションで現在地確認（`resume`/`start`）を済ませたか」
という機械的な基準で判定する。

`resume`（引数なし）は、専用サブエージェント `.claude/agents/issue-mr-resume.md` を起動し、
現在チェックアウトされているブランチだけを手がかりに以下を機械的に収集・報告させる
（情報収集・突き合わせは調査作業であり、その過程（試行錯誤・大量の生ログ）でメイン会話の
コンテキストを汚さないよう、読み取り専用の別エージェントに分離する）。

1. `git branch --show-current` で現在のブランチ名を取得する（`<defaultBaseBranch>` 上、または
   ブランチが特定できない場合は、その旨を伝えて `start <issue番号>` を促し終了する）。
2. `get_issue_number_from_branch` でブランチ名からissue番号を抽出し、`get_issue` でissue内容を取得する
   （抽出できなければ「命名規則に一致しないブランチです」と警告しつつ以降を続行する）。
3. `get_mr_for_branch` で対応するPR/MRの有無・番号・URL・Draft状態を取得する。
4. PR/MRがあれば `get_mr_unresolved_comments <n> true` で全件取得し、未解決件数を集計する。
5. `get_branch_work_files` で、このブランチ固有の `plans/` `worklog/` ファイルを列挙する
   （`<defaultBaseBranch>` との差分から求めるため、削除済み＝設計反映済みの判別にも使える）。
6. `HANDOFF.md` の内容を読む。
7. 1〜6を「現在地サマリ」としてまとめ、呼び出し元（メインのAIエージェント）に返す。**HANDOFF.mdの
   記述と実際の状態（PR有無・未解決コメント件数等）に矛盾があれば、それも指摘する**。

呼び出し元は、このサマリをもとに全体フロー23ステップのうちどこから再開すべきかを判断し、
人間に提案する（この判断自体はサブエージェントの役割ではなく、呼び出し元が行う）。

`comments` / `describe` サブコマンドの「現在のブランチに紐づくMR番号を取得する」手順は、
重複実装を避けるため `get_mr_for_branch` に統一する。

### セッション開始時の自動コンテキスト注入（SessionStart hook）

`resume` は人間・AIエージェントが明示的に呼び出す必要があり、機械的に実行されない。これをClaude
CodeのSessionStart hookとして自動化し、セッション開始・resume・clear時に毎回、現在ブランチの
issue/MR状態をコンテキストへ自動注入する。

- **コンポーネント**: `.claude/hooks/session-start.sh` ＋ `.claude/settings.json` の
  `hooks.SessionStart` 設定。
- **matcher**: `startup|resume|clear` に限定する。`compact`（コンテキスト圧縮のたびに`gh` API
  呼び出しが走るのを避ける）と `fork`（今回はスコープ外）は対象外とする。
- **実行シェル**: exec form（`args`指定）で `"bash"` を呼ぶ（フルパス直書きはしない。他環境への
  移植性を優先）。ただしマシンによってはPATHの優先順位次第で素の`"bash"`がWSL起動用スタブ
  （`C:\Windows\System32\bash.exe`）に解決されてしまうため、システム環境変数（`Machine`スコープ）
  の`Path`へgit bashの`bin`をSystem32より前に来る位置で追加するセットアップが別途必要になる場合
  がある（ユーザー環境変数に追加するだけでは効果が無い。詳細:
  [shell-scripts.md](shell-scripts.md)「Claude Code hookの起動コマンド」）。
- **サブエージェントでの抑止**: 公式ドキュメント上、SessionStart hookはTask tool経由の
  サブエージェント内でも発火する（`agent_id`/`agent_type`がstdin JSONに追加される場合のみ
  判別可能）。そのためmatcherでは実現できず、スクリプト冒頭でstdinの`agent_id`の有無を見て
  即終了する実装とした。
- **情報収集**: `resume`（`issue-mr-resume`サブエージェント）と同じ`Provider.sh`の関数
  （`get_issue_number_from_branch` / `get_issue` / `get_mr_for_branch` / `get_mr_unresolved_comments`）を
  再利用する。hookはサブエージェントを起動できないため、同種の情報収集ロジックを持つ独立スクリプト
  として実装した。表示内容は「ブランチ／issue／PR（Draft状態含む）／未解決レビューコメント件数」に
  絞り、`get_branch_work_files`によるplan/worklogファイル一覧や`HANDOFF.md`の内容表示は含めない
  （それらは`resume`の役割のまま維持し、hookは軽量な自動通知に留める）。
- **出力形式**: `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<text>"}}`
  形式のJSONをstdoutへ返す。
- **フォールバック方針**: `main`ブランチ上（作業ブランチ未チェックアウト）では注入しない。
  `gh`未認証・API失敗等、情報収集に失敗した場合もセッション開始をブロックせず、短い失敗メッセージ
  のみを返す（best-effort。詳細な原因調査は人間が手動で行う）。

### Draft PR作成失敗時の自動リトライ

`new_draft_merge_request` は `new_issue_branch` 直後（baseとの差分がまだ無い状態）で呼ぶと
`gh pr create` / `glab mr create` が失敗する既知の制約がある。コマンドの失敗を検知した場合、
共通処理 `add_empty_commit_for_draft_mr`（空コミット+push）を実行してから1回だけ自動リトライする
（それでも失敗すればエラーを返す）。

### 対応工数レポート（PostToolUse hook, git push検知）

Claude Codeの対応工数（モデル別トークン数・ツール実行回数・assistant応答回数・稼働時間）をMRへ
自動投稿する。

- **投稿トリガー**: `git push` 成功時に、前回投稿からの差分をMRへ新規コメントとして投稿する
  （毎ターン投稿やコメントのupsertではない）。
- **記録範囲**: モデル別トークン数（input/output/cache write/cache read。**既知の過小カウント要因
  あり**。詳細は「未決定事項・懸念点」参照）＋ツール実行回数＋assistant応答回数＋稼働時間
  （`activeSeconds`。下記「稼働時間の算出方法」参照）。推定コスト(USD)・ファイルdiff・プロンプト本文・
  サブエージェント詳細往復は対象外。
- **稼働時間の算出方法（gapベースのidle検出＋tail buffer）**: 単純な「セッション開始〜最終メッセージ」
  の経過時間では、`AskUserQuestion`等での人間の回答待ちや応答終了後の次指示待ちのような
  「作業していない時間」を含んでしまう。同種の課題を扱う参考実装（Claude Code transcriptから
  実働時間を算出するOSS）を調査し、共通して採用されている「gapベースのidle検出＋セグメント末尾の
  tail buffer」方式を採用した。
  - `IDLE_GAP_THRESHOLD_SECONDS`（既定300秒=5分）: 集計対象entry（`gitBranch`一致・assistant）を
    時系列順に走査し、直前entryとの`.timestamp`差（gap）がこの閾値**未満**なら稼働時間へそのまま
    加算する。閾値**以上**（ちょうど閾値も含む）のgapは「人間の入力待ち」とみなし、gap自体は
    加算しない（区間＝セグメントが1つ閉じる）。
  - `TAIL_BUFFER_SECONDS`（既定30秒）: セグメントが閉じるたびに末尾へこの秒数を加算する
    （応答を読む・確認する等、次のgapとしては現れない実作業時間の補完）。走査完了時点で、
    集計対象entryが1件以上あれば「現在末尾の（まだ閉じていない）セグメント」に対し同様に1回
    加算する。これにより、entryが1件しかないセッションでも稼働時間が0にならない。
    - この「末尾セグメントの暫定クローズ」による加算は、次回pushで同じセッションのtranscriptが
      伸びて再集計されると「実際のgap＋新しい末尾へのtail buffer」に置き換わる。置き換え後の値は
      常に元の値以上になるため、`activeSeconds`（セッション開始からの累計稼働秒数）は再集計を
      繰り返しても単調非減少であり続け、既存の累計差分パターン（後述）に影響しない。
  - **`fromdateiso8601`は使わない**（Windowsネイティブ版jqが`strptime`/`mktime`を実装しておらず
    `strptime/1 not implemented on this platform`で失敗するため）。代わりに`strptime`/`mktime`に
    依存しない自前実装（`days_from_civil`アルゴリズムによる四則演算のみのISO8601→epoch秒変換、
    `UsageTracking.sh`の`epoch_from_iso8601`）を使う。
  - **既知の制約（目安であることの根拠）**: 閾値未満の短い待機（人間がすぐ返信した場合等）は
    稼働時間に混入しうる、閾値以上の長時間ツール実行（大きめのビルド等）は稼働時間から漏れうる、
    tail bufferは固定値のため実際の読了時間との過不足がありうる。「目安」である旨をレポート・
    このドキュメントに明記する（既存のトークン集計と同じ扱い）。
  - `activeSeconds`は`assistantCount`と同じ「0始まりの累計値」という性質を持つため、
    `_usage_merge_state`側は既存の`turns`と全く同じ差分計算パターン（`current - prevSession値`、
    前回スナップショット無しなら`current - 0`、下限0）をそのまま流用する。セッションごとの永続状態
    （`sessions[<sessionId>]`）には`lastActiveSeconds`を`lastTokens`等と同様に保存する。
  - 複数セッション・複数プロジェクトが同時進行した場合の区間重複除去（overlap dedup）は本対応の
    スコープ外（単一ブランチ・単一セッションの範囲で完結する対応工数レポートのため）。
- **コンポーネント**:
  - `.claude/hooks/lib/UsageTracking.sh`（共有ライブラリ）: `sync_usage_state <repoRoot> <branch>
    <sessionId> <transcriptPath>` が集計本体。`transcript_path`のJSONLをjqで1行ずつパースし
    （不正な行・空行は無視するベストエフォート）、`.gitBranch == <branch>` のエントリのみを対象に、
    `message.usage`（モデル別トークン数）、`message.content[].type=="tool_use"`（ツール名別呼び出し
    回数）、該当エントリ件数（assistant応答回数）、および`.timestamp`のgapベース算出による稼働時間
    （`activeSeconds`）を集計する。前回このセッションで記録した累計との**差分**を、ブランチ単位の
    状態ファイル（`.claude/usage-state/<branch>.json`、gitignore対象）の`sinceLastPush`へ加算する。
  - `.claude/hooks/post-push-usage-report.sh`（`PostToolUse` hook）: `.claude/settings.json` の
    matcher `Bash|PowerShell` と `if: "Bash(git push*)"` / `if: "PowerShell(git push*)"` により
    `git push` を含むコマンド実行後のみ発火する。投稿要否判定の前に自分で `sync_usage_state` を
    呼んで状態を最新化してから投稿する（ターンの途中でのpushでも記録漏れが起きないようにするため）。
    `sinceLastPush` が全て0なら投稿しない。`get_mr_for_branch` でMRが無ければ投稿しない。
    投稿成功後のみ `sinceLastPush` をリセットする（失敗時は次回pushへ繰り越す。git push自体は
    ブロックしない）。コメント本文には`fmt_duration`（秒→`H時間M分`/`M分`形式）で整形した
    「対応工数（目安・入力待ち時間を除く）」の行を含める。
  - `.claude/settings.json`: `hooks.PostToolUse`。
  - `.gitignore`: `/.claude/usage-state/`。
- **`Stop` hookは使わない**: `post-push-usage-report.sh` 自身がtranscript差分方式で集計すれば
  十分であり、`Stop`依存のカウントは「そのターンのStopがまだ発火していない状態でのpush」で
  過少カウントになるため採用しなかった。
- **投稿内容の位置づけ**: コメント本文冒頭に「このコメントはClaude Codeによる自動投稿です。
  レビューの合否判定には使用しないでください。」と明記する（`add_mr_comment` は通常コメントであり
  レビューではないため、そもそも承認状態に影響しない）。
- **フッターの免責事項説明文は初回投稿のみ表示**: 集計方法や既知の過小カウント要因を説明する
  詳しめのフッター文は、同じMRへ毎回のpushで繰り返し投稿されると冗長になるため、そのブランチ
  （MR）に対して**過去に投稿成功したことがあるか**（状態ファイルの`lastPostedAt`の有無、投稿前
  時点の値で判定）で分岐し、初回投稿時のみ表示する。冒頭の「レビューの合否判定には使用しないで
  ください」という短い注記は、投稿ごとの判別のために必要なため毎回表示する。
- **制約: スクリプト経由の`git push`は検知されない**: 投稿トリガーの判定は、Bash/PowerShell
  ツールへ渡された`tool_input.command`文字列が`git push`で始まるかどうかの前方一致マッチ
  （`.claude/settings.json`の`if: "Bash(git push*)"` / `if: "PowerShell(git push*)"`）に依存する。
  そのため、`git push`をラップしたスクリプト（`bash deploy.sh`等）や、gitのエイリアス、他言語の
  subprocess経由でpushした場合は`tool_input.command`自体に`git push`という文字列が現れず、
  hookプロセスが起動されないため検知できない。git pushをラップしたスクリプトを作成することや
  git pushコマンドを前方一致マッチにHITしないような形式で実行することを**禁止**する。投稿対象は
  使用量レポート（参考情報）のみでpush自体をブロックする機能ではないため、影響は該当push分の
  投稿が漏れることに留まる（次回、検知条件に一致するpush時に`sinceLastPush`が繰り越されて
  投稿される）。

### ブランチ命名

`<branchPrefixTemplate>`（既定 `feature-{issue}-{slug}`）に従い、issue番号をそのまま連番として使う
（別途の採番管理はしない）。`{slug}` はissueタイトルを英数字・ハイフンへ簡易変換したもの。

### Issueテンプレート標準化

issue本文の書き方を標準化し、ワークフローの起点（ステップ1・2）の情報の粒度を揃える。人間がissueを
作る際は、以下4項目を見出し（`## `）付きで記載することを標準とする。

- **目的**: このissueで解決したい課題・達成したいこと
- **現状**: 現在の状態・困っていること
- **期待する動作**: 対応後にどうなっていてほしいか
- **受け入れ条件**: このissueが「完了」と判断できる具体的な条件（箇条書き）

これをGitHub/GitLab双方のissueテンプレート機能で起票時に差し込む想定。

- **`.github/ISSUE_TEMPLATE/task.md`**: GitHubの[Issueテンプレート（Markdown形式）](https://docs.github.com/ja/communities/using-templates-to-encourage-useful-issues-and-pull-requests/manually-creating-a-single-issue-template-for-your-repository)。
  YAML front matter（`name` / `about`）＋4見出しの記入欄で構成する。GitHubのissue作成画面で
  テンプレートとして選択できる。
- **`.gitlab/issue_templates/task.md`**: GitLabの[Description templates](https://docs.gitlab.com/user/project/description_templates/)。
  front matter無しの同内容のMarkdown。本リポジトリはGitLabリモートを使わないため現状未配置
  （GitLabを使い始める場合に追加する）。

どちらもMarkdownテンプレートであり、必須項目としての強制はできない。強制ではなく「標準の見出しを
用意して迷わず書けるようにする」ことが目的。

`/issue-mr-flow start` 側の対応: `get_issue` で取得したissue本文に4見出し
（`## 目的` / `## 現状` / `## 期待する動作` / `## 受け入れ条件`）が揃っているかを
`Provider.sh` の `test_issue_sections` でチェックし、欠けている見出しがあれば警告として提示する
（処理は止めない。テンプレートを使わず手動で作られた既存issueにも同じチェックが働く）。

## 影響範囲

- `dev-tools/src/vcs/{Provider,Github,Gitlab}.sh`
- `.mrworkflow.json`（リポジトリ直下）
- `.claude/skills/issue-mr-flow/SKILL.md`
- `.claude/agents/issue-mr-resume.md`
- `.claude/hooks/{session-start,post-push-usage-report}.sh`, `.claude/hooks/lib/UsageTracking.sh`
- `.claude/settings.json`（`hooks.SessionStart` / `hooks.PostToolUse`）
- `.github/ISSUE_TEMPLATE/task.md`
- `.gitignore`（`/.claude/usage-state/`）
- 本ドキュメント

## 設定項目

`.mrworkflow.json`（本リポジトリの初期値）

```jsonc
{
  "branchPrefixTemplate": "feature-{issue}-{slug}",
  "defaultBaseBranch": "main",
  "plansDir": "plans",
  "worklogDir": "worklog",
  "specDirs": ["docs/spec", "dev-tools/docs/spec"],
  "ddrDirs": ["docs/ddr", "dev-tools/docs/ddr"]
}
```

## 未決定事項・懸念点

- **GitLab側の動作未検証**: このリポジトリの実remoteはGitHubのみのため、`Gitlab.sh`はAPI仕様を
  調べた上での実装となり、実機での動作確認ができていない。GitLab側のテスト方法（別リポジトリ
  用意等）は今後の課題。
- **全角文字のみのissueタイトルのスラッグ化**: `to_slug`はASCII英数字のみを残す簡易実装のため、
  全角文字のみのタイトルは空文字となり `issue` にフォールバックする。ブランチ名は
  `feature-<issue番号>-issue` のように番号のみで区別される形になるが、番号自体が一意なため実害は
  ない。より説明的なスラッグが必要になった場合はローマ字変換等の対応を別途検討する。
- **言語/コンポーネント別の実装スキルの整備状況**: `.claude/skills/vscode-extension-implement/SKILL.md`
  は現状TODOスタブであり、`issue-mr-flow`の該当ステップ（設計ドキュメント作成〜実装）を具体的に
  委譲できる状態ではない。TypeScript/VS Code拡張のコーディング規約が固まり次第整備する。
- **`resume` の「現在地」判定の精度**: `get_branch_work_files` は `<defaultBaseBranch>` との差分で
  plan/worklogファイルを推定するヒューリスティックであり、複数issueを1ブランチで扱う等の
  変則的な運用では正しく機能しない可能性がある。通常運用（1ブランチ1issue）を前提とする。
- **transcript JSONLの非公開フォーマット依存**: 対応工数レポート機能は、Claude Code非公開の
  内部フォーマットである`transcript_path`のJSONLを自前パースしている。将来のバージョンで形式が
  変わった場合、集計が0件になる（ベストエフォート設計のため実害は対応工数が記録されなくなるのみ）。
- **トークン数（`tokensByModel`）は既知の過小カウント要因を持つ**: 外部調査によると、Claude Codeの
  transcript JSONLはストリーミング応答の開始時点で`usage.input_tokens`等にプレースホルダー値
  （0または1）を書き込み、応答完了後もその値を実際のトークン数へ更新しないケースがあり、結果として
  過小カウントが観測されたと報告されている。本機能はこの`transcript_path`を唯一の情報源として
  自前パースしているため、同じ制約をそのまま引き継ぐ。稼働時間（`activeSeconds`）は`.timestamp`の
  差分のみを使うため、この過小カウント問題の影響を受けない。レポート・ドキュメント双方で「目安」
  である旨を明記することで対応する。
- **セッション（transcriptファイル）を跨いだ集計は未対応**: `/resume`等で新しいtranscriptファイルに
  切り替わった場合、旧セッション分の使用量との合算は行わない（新しい`session_id`としてゼロから
  集計が始まる）。
- **状態ファイル書き込みの排他制御が無い**: 複数のClaude Codeセッションが同一ブランチに対して
  同時にhookを発火させた場合、`.claude/usage-state/<branch>.json`への読み書きにロックが無いため、
  一方の更新が失われる可能性がある（レースコンディション）。単一開発者が同一作業ディレクトリで
  複数セッションを同時実行する運用は想定しにくいため許容している。
- **稼働時間（`activeSeconds`）は目安であり、2方向の誤差要因がある**: `IDLE_GAP_THRESHOLD_SECONDS`
  （既定300秒）未満の短い待機（人間がすぐ返信した場合等）は稼働時間に混入しうる一方、閾値以上の
  長時間ツール実行（大きめのビルド等）は逆に稼働時間から漏れる。加えて`TAIL_BUFFER_SECONDS`
  （既定30秒）は固定値のため、実際の読了・確認時間との過不足が生じる。いずれもgapベースの閾値
  判定という設計上の単純化によるもので、トークン集計と同様「目安」として扱う。
- **複数セッション・複数プロジェクト同時進行時の稼働時間の重複除去（overlap dedup）は未対応**:
  仮に同一ブランチで複数セッションを並行実行した場合、それぞれの`activeSeconds`が単純合算され、
  実際の稼働時間より過大になりうる。
