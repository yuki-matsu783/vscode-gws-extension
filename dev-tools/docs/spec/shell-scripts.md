---
title: 開発補助スクリプトのシェル言語方針
type: spec
description: 開発補助スクリプトをbashで書く方針と、Windows/git bash特有の実装上の注意点をまとめた仕様
tags: [bash, powershell, spec]
keywords: [git-bash, jq, パス変換, bash化, フック起動]
---

# 開発補助スクリプトのシェル言語方針

## 背景・目的

開発補助スクリプト（issue-mr-flowの中核であるVCS抽象化層、Claude Code hook、単体テスト等）は
**bashで記載する**方針とする。PowerShellはWSL等の非Windows的なシェル環境から扱いにくいため、
git bash経由で同等のことが行えるスクリプトはbash化し、行えないものだけPowerShellを使う。

本方針・各種実装知見は、参考プロジェクト（Claude Codeによるissue駆動開発フローが成熟していた
別プロジェクト）でのbash移行の経験を汎用化して引き継いだもの（経緯:
[docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 仕様

### 対象スクリプト

| ファイル | 役割 |
|---|---|
| `dev-tools/src/vcs/Provider.sh` | issue-mr-flowの中核。GitHub/GitLab差異吸収 |
| `dev-tools/src/vcs/Github.sh` | `gh` CLIラッパー |
| `dev-tools/src/vcs/Gitlab.sh` | `glab` CLIラッパー（未検証。GitLab実remoteが無いため） |
| `dev-tools/src/archive-reentrant-plan.sh` | Planモード再突入時の計画退避 |
| `dev-tools/src/extract-frontmatter.sh` | frontmatter抽出・`index.jsonl`生成 |
| `.claude/hooks/session-start.sh` | SessionStart hook |
| `.claude/hooks/post-push-usage-report.sh` | PostToolUse hook（使用量レポート） |
| `.claude/hooks/lib/UsageTracking.sh` | 上記hookの共通集計ロジック |

### 前提

- git bash（Git for Windows付属のMSYS bash。既存の`git`利用が前提のため追加インストール不要）
- `jq`（JSON操作。**新規の外部依存としてインストールが必要**）
- `gh`/`glab` CLI（利用するVCSに応じて）

### 設計方針

- **戻り値**: JSON文字列をstdoutへ出力する設計に統一する。呼び出し側は`jq`でフィールドを取り出す
  （例: `get_issue 6 | jq -r '.title'`）。JSONのキー名はbash/jqのエコシステムに合わせて
  camelCase（`number`/`title`/...）に統一する。
- **関数命名**: snake_case関数を使う（例: `get_issue`、`new_issue_branch`）。
- **エラー方針**: `set -euo pipefail`を採用する。
- **bashでのtry/catch相当の書き方**: 本体処理を関数化し、コマンド置換`$(func)`または明示的な
  実サブシェル`( func )`の中で呼ぶ。
  - **理由**: bashは`if cmd; then...else...fi`や`cmd1 || cmd2`のような条件式の中では、`set -e`
    による「コマンド失敗時に即座にシェルを終了する」動作が一時停止される仕様がある。この一時停止は
    条件式として評価される間、そこで呼ばれる関数の内部にまで及ぶため、関数呼び出しをそのまま
    条件式に置くと、内部で複数のコマンドが順に実行される場合、途中で失敗があっても最後まで
    実行され続けてしまい、「最初の失敗で即座に中断」という直感的な動作にならない。
  - **対策**: コマンド置換 `$(...)` や `( ... )` は実行時に必ず新しいプロセス（サブシェル）へ
    フォークされる。フォークされたサブシェルの内部では、そのサブシェル自身の視点で見て
    「条件式の中にいる」わけではないため、`set -e`（呼び出し元から継承される）が正しく機能し、
    内部で失敗したコマンドの時点で即座にサブシェルごと終了する。その終了コードは呼び出し元の
    `if`/`||`から正しく検知できる。
  - **採用箇所**: `session-start.sh`（`build_context`関数。成功時はstdout経由でコンテキスト文字列を
    受け取り、失敗時はフォールバックメッセージを出す）、`post-push-usage-report.sh`（`main`関数。
    失敗はすべて握りつぶしgit push自体はブロックしない）。
- **git bashのパス変換**: `/in`のようなDOS形式の単一スラッシュ引数を、Windowsネイティブの
  非MSYS実行ファイルに渡すと、git bash（MSYS）が「POSIXパスらしき文字列」と誤認しWindowsパスへ
  自動変換してしまう既知の問題がある。先頭を`//`にする（`//in`）とMSYSの自動変換対象から外れ、
  ネイティブ側には`/in`として渡る。DOS形式フラグを持つネイティブコマンドを呼ぶ際はこの対策を行う。
- **文字コード**: git bashの標準入出力・パイプ・`jq`/`gh`とのやり取りはシステムのANSI/OEMコード
  ページの影響を受けないため、PowerShellで必要な明示的なUTF-8切り替え
  （`.claude/rules/powershell-encoding.md`参照）はbashスクリプトには不要。ただし非MSYSネイティブ
  コマンドの出力はシステムのコードページ（cp932等）のまま返ることがある。この種のコマンドの
  出力を判定に使う場合は、日本語メッセージの文字列一致を避け、終了コードやASCII文字列での判定に
  留める。
- **Claude Code hookの起動コマンド**: `.claude/settings.json`のhook `command`は `"bash"` とだけ
  指定する（実行体をフルパスで固定しない。他環境への移植性を優先する方針）。ただし環境によっては、
  Windowsの`PATH`（システム環境変数）が`C:\Windows\System32`（`bash.exe`というWSL起動用スタブが
  存在する）を`C:\Program Files\Git\cmd`より先に列挙しており、しかもGit for Windowsのインストーラは
  既定で`Git\cmd`（`git.exe`用）のみを`PATH`に追加し、`bash.exe`のある`Git\bin`は追加しないため、
  素の`"bash"`がエラーにならず**WSL側のbash.exeスタブへ黙って解決されてしまう**ことがある
  （`where.exe bash`で確認できる。WSL内では`${CLAUDE_PROJECT_DIR}`がWindows形式パスのままのため
  解決できず、hookは例外を握りつぶす設計のためエラーも出ずに黙って動作しなくなる）。
  - **対処（PATHへのgit bash追加＋順序調整）**: `C:\Program Files\Git\bin`を、
    `C:\Windows\System32`より**前**に来るよう**システム環境変数**（`Machine`スコープ）の`Path`へ
    追加する。**ユーザー環境変数`Path`に追加するだけでは効果が無い**（Windowsの有効PATHは
    「システム環境変数のPath」を先頭に、その後ろに「ユーザー環境変数のPath」を連結して構成される
    ため、`C:\Windows\System32`のようなシステム環境変数側のエントリは、ユーザー環境変数側に何を
    積んでも常に先に解決されてしまう）。設定方法はPowerShellのみを案内する（`setx`はシステムPATHが
    1024文字を超えると値を切り詰めて破壊する既知の危険があり、システムPATHは他ソフトの追加で既に
    長くなっていることが多いため避ける）。管理者権限のPowerShellで実行する:
    ```powershell
    $gitBin = "C:\Program Files\Git\bin"
    $current = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($current -notlike "*$gitBin*") {
      [Environment]::SetEnvironmentVariable("Path", "$gitBin;$current", "Machine")
    }
    ```
    （Git for Windowsの実際のインストール先が異なる場合は`$gitBin`をそちらの`bin`フォルダへ
    書き換える。上記は先頭に追加するため`C:\Windows\System32`より前に来る。）
    実行後、開いているターミナル・Claude Codeセッションを再起動し、`where bash`（PowerShell/cmd上）で
    `C:\Program Files\Git\bin\bash.exe`が最初に出ることを確認する。
  - この対処をしていない環境では、SessionStart/PostToolUseの自動コンテキスト注入・使用量レポート
    投稿がエラーも出さずに動かなくなる（`git`コマンド自体は通常通り動くため気づきにくい）。

## 影響範囲

- `dev-tools/src/vcs/{Provider,Github,Gitlab}.sh`
- `dev-tools/src/archive-reentrant-plan.sh`, `dev-tools/src/extract-frontmatter.sh`
- `.claude/hooks/{session-start,post-push-usage-report}.sh`, `.claude/hooks/lib/UsageTracking.sh`
- `.claude/settings.json`（hook `command`を`bash`に）
- `.claude/rules/shell-script-style.md`（bashスクリプトの規約）
- `.claude/rules/powershell-encoding.md`（「PowerShellを直接書く場合のみ適用」である旨）

## 設定項目

新規のSettings値は不要。

## 未決定事項・懸念点

- **GitLab版の実機動作未検証**: `Gitlab.sh`はこのリポジトリの実remoteがGitHubのみのため未検証。
  GitLabリポジトリで実際に使う前に動作確認が必要。
- **hook起動コマンドのPATH依存はマシンごとの手動セットアップが必要になりうる**: `"bash"`のみ・
  PATH解決方式を採用しているため、この対処（システム環境変数`Path`の変更、管理者権限が必要）は
  リポジトリ側のファイルには残らない。新しい開発機でこのリポジトリを使い始める際は、必要に応じて
  手動セットアップが要る。
- **"PowerShellのまま残すべきスクリプト"の実例が無い**: 現時点で対象スクリプトは全てbash化されて
  おり、判断基準（git bashで実行不可能なもの）を実際に適用した例が無い。今後、PowerShell固有機能
  （COM操作・.NETクラスの直接利用等）に依存する新規スクリプトが必要になった場合の判断基準は、
  その時点で改めて検討する。
- **`jq`のインストール確認手順が無い**: `gh`/`glab`と異なりインストール状況を確認する仕組みが
  スクリプト側に無い。未インストール時は`jq: command not found`のような分かりにくいエラーになる
  （実害は小さいが改善余地がある）。
