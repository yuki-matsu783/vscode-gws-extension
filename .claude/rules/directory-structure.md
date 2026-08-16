# ディレクトリ構成

各ディレクトリの役割説明は [index.md](../../index.md)（Repository Map）を正とする。本ファイルは
ツリー構造・配置ルールと、個別ファイル（後述のツリー内でコメント付きのもの）の役割を扱う
（ディレクトリの役割説明を重複記載しない）。

`vscode-gws-extension` はREADME.mdに記載された「VS Code拡張 + Python API + Playwright/NotebookLM連携」
システムのうち、**VS Code拡張部分のみ**を管理するリポジトリである。Python API・Playwright自動化の
部分は別リポジトリの管轄であり、本リポジトリのスコープ外。

## 現在のツリー

拡張本体は`yo code` / generator-codeによるTypeScript雛形（issue #2）に、右クリックメニュー→外部API
送信サンプル（issue #4）、サイドバーReact Webviewサンプル（issue #6）、メインエディタ領域React
Webviewサンプル（issue #7）を実装した状態。

```
vscode-gws-extension/
├── src/
│   ├── extension.ts            # 拡張のエントリポイント（activate/deactivate）。コマンド登録・
│   │                            # WebviewViewProvider/コマンドからのWebviewPanel起動の登録を行う
│   │                            # （実処理は極力持たない）
│   ├── webview/                 # React Webview（サイドバーview・メインエディタパネル）のソース一式
│   │   ├── SidebarViewProvider.ts # ホスト側: vscode.WebviewViewProvider実装（サイドバー常駐）、
│   │   │                          # getWebviewHtmlの呼び出し、postMessage受信→コマンド実行の橋渡し
│   │   ├── EditorPanelProvider.ts # ホスト側: vscode.window.createWebviewPanelのシングルトン
│   │   │                          # 管理クラス（メインエディタ領域、公式webview-sampleの
│   │   │                          # CatCodingPanelパターン準拠）。createOrShow/onDidDispose
│   │   ├── getWebviewHtml.ts      # CSP/nonceベースのHTML生成ユーティリティ（両Providerで共有）
│   │   ├── index.tsx              # webview側Reactエントリポイント（サイドバー用、createRoot）
│   │   ├── App.tsx                # Reactコンポーネント本体（サイドバー用）
│   │   ├── editorPanelIndex.tsx   # webview側Reactエントリポイント（メインエディタパネル用）
│   │   ├── EditorApp.tsx          # Reactコンポーネント本体（メインエディタパネル用）
│   │   ├── vscodeApi.ts           # acquireVsCodeApi()の単一取得ラッパー（両entry pointで共有）
│   │   └── tsconfig.json          # webview専用の型チェックtsconfig（jsx/DOM libを持つ。noEmit）
│   └── test/                   # @vscode/test-cli によるテスト（extension.test.ts）
├── media/
│   └── icon.svg                 # Activity Bar用アイコン（contributes.viewsContainersから参照）
├── esbuild.js                   # Webview（src/webview/）をout/webview/{main,editorPanel}.jsへ
│                                 # バンドルするスクリプト（entryPointsを複数指定）
├── out/                         # tsc/esbuildのビルド出力。gitignore対象
├── .vscode/                     # launch.json（F5でExtension Development Host起動）等
├── package.json                 # 拡張マニフェスト（name/contributes/scripts等）
├── tsconfig.json                 # 拡張ホスト側。rootDir=src, outDir=out。参考ディレクトリ/・
│                                  # src/webview はexclude（webview側はsrc/webview/tsconfig.jsonで別途型チェック）
├── .vscodeignore                 # vsce package時の除外設定
├── eslint.config.mjs
├── .vscode-test.mjs
├── vsc-extension-quickstart.md   # yo code生成の開発者向けクイックスタート
├── CHANGELOG.md
├── docs/
│   ├── README.md             # docs配下の目次
│   ├── spec/                 # 拡張本体の機能仕様（正史。実装完了のたびに最新仕様へ上書きする）
│   └── ddr/                  # 意思決定ログ（DDR。追記のみ）
├── dev-tools/
│   ├── src/
│   │   ├── vcs/               # GitHub/GitLab抽象化層（Provider.sh, Github.sh, Gitlab.sh）
│   │   ├── archive-reentrant-plan.sh
│   │   └── extract-frontmatter.sh
│   └── docs/
│       ├── README.md         # dev-tools配下の目次
│       ├── spec/
│       └── ddr/
├── tests/                     # dev-tools配下のbashスクリプトに対する単体テスト
├── .claude/
│   ├── agents/
│   ├── skills/
│   ├── rules/
│   ├── hooks/
│   │   └── lib/
│   ├── scripts/               # 現状未使用のプレースホルダー
│   ├── usage-state/            # hookが生成するephemeralな使用量状態（gitignore対象）
│   └── settings.json
├── plans/                     # Planモード出力（セッション単位）
├── worklog/                   # ブランチ単位の詳細作業ログ
├── .github/ISSUE_TEMPLATE/
├── .gitlab/issue_templates/    # 現状未配置（GitLabリモートを使わないため）
├── 参考ディレクトリ/            # ローカル専用の参照用clone。.gitignore対象。下記「参考ディレクトリの扱い」参照
├── .gitignore
├── .mrworkflow.json
├── CLAUDE.md                  # プロジェクト概要・開発実行・.claude/rules/ へのポインタ
├── GEMINI.md
├── HANDOFF.md                 # セッション間・作業者間の軽量な引継ぎメモ
├── AGENTS.md
├── DEVELOPERS.md
├── index.md
└── README.md
```

## 拡張本体（src/）のディレクトリ構成

issue #6（サイドバーReact Webviewサンプル）対応で、`src/extension.ts`（拡張ホスト）と
`src/webview/`（React Webview）を分離する構成に決定した（経緯:
[docs/ddr/0004-サイドバーReact-Webviewサンプルの技術構成を決める.md](../../docs/ddr/0004-サイドバーReact-Webviewサンプルの技術構成を決める.md)）。
`src/extension.ts`を`src/extension/`ディレクトリへ分割する変更は、現状1ファイルで十分小さいため
見送っている（拡張ホスト側のファイルが増えてきた場合に改めて検討する）。

TypeScript/React Webviewのコーディング規約は
[.claude/rules/vscode-extension-style.md](vscode-extension-style.md) に定義した
（`.claude/skills/vscode-extension-implement/SKILL.md` と
`.claude/agents/vscode-extension-code-reviewer.md` のTODOもあわせて解消済み）。

## 配置の指針

- 開発者向けツール（issue駆動ワークフロー支援スクリプト等）はアプリ本体の機能と混在させず、
  `dev-tools/` 配下に置く。`dev-tools/src/` にスクリプト本体、`dev-tools/docs/` に関連ドキュメントを
  置き、ドキュメント運用（`docs-workflow.md`）は `dev-tools/docs/` にも同様に適用する。
- `.claude/hooks/` 配下のスクリプトは現在すべてbash（`.sh`）。新規`.ps1`を作成する場合のみ
  **BOM付きUTF-8で保存する**こと（BOM無しだとWindows PowerShell 5.1でパースエラーになる。詳細:
  `.claude/rules/powershell-encoding.md`）。`.sh`はBOM無しUTF-8・LF改行で保存する
  （詳細: `.claude/rules/shell-script-style.md`）。複数hookスクリプトで使い回すロジックは
  `.claude/hooks/lib/` に切り出す。
- 開発補助スクリプト（`dev-tools/src/`, `.claude/hooks/`, `tests/`配下のシェルスクリプト等）は
  git bash経由で実行可能な範囲でbash（`.sh`）を使う。bash化できない場合のみPowerShell（`.ps1`）と
  する。bashスクリプトは`jq`（JSON操作）を前提とする。詳細な判断基準・規約は
  `dev-tools/docs/spec/shell-scripts.md`, `.claude/rules/shell-script-style.md` を参照。
- `参考ディレクトリ/`（リポジトリ直下、`.gitignore`対象）: 設計・実装の参考にするため作業者が
  ローカルへcloneした外部OSS等を置く場所。リポジトリ本体には含めないため、上記ツリーには
  登場しない。存在する場合、中身の調査は問題ないが、その配下のファイルをコミット対象に含めたり、
  そのリポジトリ自体の構成をvscode-gws-extension側へそのまま流用したりしないこと（内容を
  汎用化した上で個別に取り込む。あくまで参照専用）。
