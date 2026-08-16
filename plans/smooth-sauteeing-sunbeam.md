---
title: yo code (generator-code) によるTypeScript拡張機能の雛形作成
type: log
description: issue #2「VSCODEの拡張機能を作成するためのfirst stepを行う」に対応するPlanモード出力
tags: [vscode-extension, scaffold, yo-code, generator-code]
keywords: [yo code, generator-code, TypeScript, package.json, tsconfig, gitignore, README, F5デバッグ]
---

# Plan: yo code (generator-code) によるTypeScript拡張機能の雛形作成

## Context

issue #2（[VSCODEの拡張機能を作成するためのfirst stepを行う](https://github.com/yuki-matsu783/vscode-gws-extension/issues/2)）に対応する。issue本文は
[VS Code公式のfirst extensionガイド](https://code.visualstudio.com/api/get-started/your-first-extension)
へのリンクのみで、標準4見出し（目的/現状/期待する動作/受け入れ条件）は記載されていなかった。
ユーザーとの確認により、今回のスコープは
**`yo code`（generator-code）でのTypeScript拡張機能の雛形作成〜F5デバッグ起動確認まで**とする
（Reactは含めない。Webview実装は別issue）。着手時点でソースコードが存在しない状態
（[docs/ddr/0001](../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)参照）から、実際に
拡張本体のソースコードを配置する最初のステップとなる。

`.claude/rules/directory-structure.md` の「TODO: 拡張本体（src/）のディレクトリ構成」節、
`DEVELOPERS.md` の各TODO節（動作環境・ソースから実行する・ビルド）は、実装着手時にこの節を埋める
形で更新することと明記されており、本タスクがその最初の着手にあたる。

## 出力先の決定（衝突ファイルの扱い）

`yo code . -t=ts` を素直に実行すると、生成される `README.md` が既存のREADME.md（システム全体の
アーキテクチャ説明）と衝突する。ユーザーとの確認の結果、**リポジトリ直下に生成し、衝突するファイルは
事前に退避してから実行、生成後は既存版を復元する**方針とした。

事前にgenerator-codeのソース（`microsoft/vscode-generator-code`, `-t=ts` = `generate-command-ts.js`）
を確認し、以下を把握済み:

- `--gitInit=false` を指定すると `.gitignore` はそもそも生成されない
  （`writing`関数で `if (extensionConfig.gitInit) { ... .gitignore ... }` のため）。
  → 生成されるのは実質 **README.md のみ**が既存ファイルと衝突する。
  他の生成物（`package.json`, `tsconfig.json`, `.vscode/`, `.vscodeignore`, `CHANGELOG.md`,
  `src/extension.ts`, `src/test/`, `.vscode-test.mjs`, `eslint.config.mjs`,
  `vsc-extension-quickstart.md`）は現在のリポジトリに存在しないため衝突しない。
- quickモード（`-q`）はフォルダ名（`vscode-gws-extension`）から拡張機能名/IDを自動導出する。
- bundlerは指定しなければ既定で `unbundled`（プレーンな `tsc` ビルド、`out/extension.js` 出力）。
- `.gitignore`テンプレートの内容は `out`, `dist`, `node_modules`, `.vscode-test/`, `*.vsix`
  （`gitInit=false`により自動生成されないため、この内容を手動で既存の`.gitignore`に追記する）。

## 実施内容

1. 既存の `README.md` をリポジトリ外の一時退避先（スクラッチパッド）へ退避する。
2. 以下のコマンドでTypeScript拡張機能の雛形を生成する（`npx`経由、`yo`/`generator-code`は
   グローバル未インストールのためワンショット実行。stdinは `/dev/null` にリダイレクトし、
   万一想定外のプロンプトが出た場合はハングせず即座に失敗させる）。

   ```bash
   npx --yes --package yo --package generator-code -- yo code . -t=ts --pkgManager=npm --gitInit=false -q < /dev/null
   ```

   `installDependencies=true` が既定のため、生成直後に `npm install` が自動実行される
   （devDependencies: `@types/vscode`, `typescript`, `eslint`, `@vscode/test-electron` 等）。
3. 生成された `README.md`（generator-codeの汎用テンプレート）を破棄し、手順1で退避した既存の
   `README.md` を復元する。
4. `.gitignore` に `out`, `dist`, `node_modules`, `.vscode-test/`, `*.vsix` を追記する
   （既存の `/参考ディレクトリ/`, `/.claude/usage-state/` の行は変更しない）。
5. `git status` で生成物一式を確認し、想定外のファイル（`.git`再初期化や意図しない上書き等）が
   無いことを確認する。
6. ドキュメントのTODO解消（directory-structure.mdが「実装着手時に更新すること」と明記している箇所）:
   - `.claude/rules/directory-structure.md`: 「TODO: 拡張本体（src/）のディレクトリ構成」節を、
     実際に生成された構成（`package.json`, `tsconfig.json`, `src/extension.ts`, `.vscode/`,
     `out/`（ビルド出力、gitignore対象）等がリポジトリ直下に配置される）で更新し、冒頭のツリー図にも
     反映する。
   - `DEVELOPERS.md`: 「動作環境」（Node.js/npmのバージョン。開発機で確認したNode v22.15.0 /
     npm 10.8.2を参考値として記載）、「ソースから実行する」（`npm install` 後、VS Codeで
     `F5`によりExtension Development Hostを起動）、「ビルド」（`npm run compile` /
     `npm run watch`）を埋める。「リリース時の手順」は配布方針が未決定のためTODOのまま残す。
   - `.claude/skills/vscode-extension-implement/SKILL.md` /
     `.claude/agents/vscode-extension-code-reviewer.md` のTODOは、コーディング規約策定に
     関わる大きめの内容のため本issueのスコープ外とし、着手しない
     （HANDOFF.mdへ次issue候補として書き添える）。

## やらないこと（スコープ外）

- React Webviewの追加（`webview-ui`等のサブプロジェクト化を含む）。
- Python API・Playwright連携部分（別リポジトリの管轄）。
- webpack/esbuildによるバンドル化、`vsce package`によるパッケージング、Marketplace配布設定。
- コーディング規約（`.claude/rules/`のTypeScript版）・コードレビューサブエージェントの整備。

## 対象ファイル

- 新規生成: `package.json`, `tsconfig.json`, `.vscode/launch.json` 等, `.vscodeignore`,
  `CHANGELOG.md`, `src/extension.ts`, `src/test/`, `.vscode-test.mjs`, `eslint.config.mjs`,
  `vsc-extension-quickstart.md`
- 更新: `.gitignore`（追記のみ）, `.claude/rules/directory-structure.md`, `DEVELOPERS.md`
- 変更なし（退避→復元）: `README.md`

## 検証方法

- `npm run compile`（`tsc -p ./`）がエラー無く完了すること。
- `npm run lint`（eslint）がエラー無く完了すること。
- `.vscode/launch.json` に "Run Extension" 相当のExtension Host起動設定が含まれることを確認する
  （実際のVS Code上でのF5起動確認はユーザー側での実施を想定し、本タスクでは設定ファイルの内容確認
  までとする）。
- `git status` / `git diff --stat` で意図した差分のみになっていることを確認する
  （`README.md`が変更されていない、`.git`が壊れていない等）。
