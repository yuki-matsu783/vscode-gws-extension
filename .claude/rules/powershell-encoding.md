# PowerShellスクリプト・コマンドの文字コード注意事項

**適用範囲**: 本ファイルはPowerShell（`.ps1`・`powershell.exe`経由のコマンド）を直接書く場合にのみ
適用する。本リポジトリの開発補助スクリプトは方針としてbash（`.sh`）を優先しており（詳細:
[dev-tools/docs/spec/shell-scripts.md](../../dev-tools/docs/spec/shell-scripts.md)「文字コード」節）、
bashにはANSI/OEMコードページの問題自体が発生しない。bashスクリプトの規約は
[shell-script-style.md](shell-script-style.md) を参照。

Windows PowerShell 5.1（`powershell.exe`。本プロジェクトの実行環境）は既定で、コンソール入出力・
`Get-Content`/`Set-Content`/`Out-File`等のファイルI/Oを**システムのANSI/OEMコードページ**
（日本語Windowsでは通常cp932）で扱う。UTF-8を前提とする`gh`/`glab` CLIとのやり取りや、日本語を含む
テキストファイルの読み書きでこれを踏まえないと、実機でのみ再現する文字化け・構文エラーが発生する
（参考プロジェクトで2種類の実例が確認されている。経緯:
[docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## VCS抽象化層をdot-sourceしていれば自動的に安全

本リポジトリの開発補助スクリプトはbash版（`dev-tools/src/vcs/Provider.sh`）が中心のため、
Provider.sh自体は上記のコードページ問題を持たない（bashの標準入出力・パイプはコードページの
影響を受けないため）。以下は、将来PowerShellスクリプトを新規に書く場合の一般的な対策として
記録している。

- `[Console]::OutputEncoding` / `[Console]::InputEncoding` をUTF-8へ切り替え（`gh`/`glab`等の
  外部コマンドとのI/Oを保護）。
- `$PSDefaultParameterValues` で `Get-Content` / `Set-Content` / `Add-Content` / `Out-File` の
  既定エンコーディングをUTF-8へ切り替え（ファイル読み書きを保護。ワイルドカード`'*:Encoding'`は
  他コマンドレットの`-Encoding`パラメータ定義と衝突して警告が出るため、対象コマンドレットを
  個別に指定する）。

## PowerShellスクリプトを新規に書く場合の注意

- 日本語を含むテキストファイルを読み書きする、または`gh`/`git`を直接呼ぶ新規のPowerShellスクリプトを
  書く場合は、上記と同じ設定（コンソールエンコーディングの切り替え、必要なら
  `$PSDefaultParameterValues`）をそのスクリプト側で行う。
- `.ps1`ファイル自体は**BOM付きUTF-8で保存する**こと。BOM無しUTF-8で保存すると、Windows PowerShell 5.1が
  日本語コメント等を正しく解釈できず、離れた箇所で構文エラーになることがある（実例: 参考プロジェクトで
  hookスクリプトを新規作成した際、BOM無しUTF-8で保存され`[Draft]`のような無関係な箇所でパース
  エラーになった）。これはランタイムの設定では防げない、ファイル保存時の性質のため、新規`.ps1`
  作成時はBOM付きUTF-8で保存する。
  **AIエージェント向け注記**: Writeツールで新規`.ps1`を作成した場合は既定でBOM無しになるため、
  作成直後に必ず以下で変換し、構文検証まで行う。

  ```powershell
  $path = "対象ファイルパス"
  $content = [System.IO.File]::ReadAllText($path)
  [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($true)))
  # 構文検証もあわせて行う
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$errors) | Out-Null
  if ($errors.Count -gt 0) { $errors | Format-List } else { "構文OK" }
  ```
