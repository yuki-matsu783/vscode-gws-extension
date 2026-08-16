---
title: 0002. yo code（generator-code）でTypeScript拡張機能の雛形を作成する
type: ddr
description: issue #2対応。VS Code拡張本体のソースコードを最初に配置する方法として、yo code（generator-code）による雛形生成をリポジトリ直下に対して行う方針を決定した経緯を記録したDDR
tags: [ddr, vscode-extension, yo-code, generator-code, scaffold]
keywords: [yo code, generator-code, TypeScript, README衝突, gitignore, gitInit, tsconfig, exclude, 参考ディレクトリ]
---

# 0002. yo code（generator-code）でTypeScript拡張機能の雛形を作成する

## 背景

issue #2「VSCODEの拡張機能を作成するためのfirst stepを行う」対応として、拡張本体
（TypeScript/React Webview想定。[README.md](../../README.md)参照）のソースコードを初めて配置する
必要があった。着手時点でソースコードは存在せず、`.claude/rules/directory-structure.md` の
「TODO: 拡張本体（src/）のディレクトリ構成」節が未確定のまま残っていた
（経緯: [0001](0001-参考プロジェクトからAI開発資産を移植.md)）。

VS Code公式のfirst extensionガイド（issue本文がリンクしていた
https://code.visualstudio.com/api/get-started/your-first-extension ）は `yo code`
（Microsoft製Yeomanジェネレータ `generator-code`）での雛形生成を案内しており、事実上の標準的な
出発点になっている。

## 決定

**`yo code` の TypeScript雛形（`-t=ts`）を、React Webviewを含めずリポジトリ直下に生成する。**

- スコープはこの雛形作成〜ビルド／Lintの動作確認までとし、React Webview・Python API/Playwright連携
  （別リポジトリ管轄）・バンドル化（webpack/esbuild）・`vsce package`によるパッケージング／
  Marketplace配布は対象外とした。
- 出力先はリポジトリ直下（`.`）とした。generator-codeは既定でREADME.md・.gitignoreを生成するため
  既存ファイルと衝突するが、事前調査（`microsoft/vscode-generator-code`のソース確認）により
  `--gitInit=false` を指定すると `.gitignore` はそもそも生成されないと判明したため、実質的な
  衝突は `README.md` のみに絞り込めると見積もった。
- 実行コマンド: `yo code . -t=ts --pkgManager=npm --gitInit=false -q`
  （`npx --yes --package yo --package generator-code -- yo code ...` 経由。`yo`/`generator-code`は
  グローバル未インストールのためワンショット実行）。
- **判明した誤算**: 実機では `--gitInit=false` が効かず、`.gitignore`衝突の確認プロンプトが表示され
  （stdinを`/dev/null`にリダイレクトしていたため即座にプロセスが強制終了した）。原因はyargsが
  `--gitInit=false` を真偽値ではなく文字列 `"false"` としてパースし、generator-code側の
  `typeof gitInit === 'boolean'` 判定に失敗、quickモードの既定値 `gitInit=true` にフォールバック
  していたためと推定される。**次回同様のスクリプトを書く場合は `--no-gitInit`
  （yargsの標準的なboolean否定構文）を使うこと。**
  結果的にこの中断は無害だった: `.gitignore`より前に書き込みキューに積まれていた他の生成物
  （`package.json`, `tsconfig.json`, `.vscode/`, `.vscodeignore`, `CHANGELOG.md`, `src/`,
  `eslint.config.mjs`, `.vscode-test.mjs`, `vsc-extension-quickstart.md`）は正常に書き込まれており、
  `README.md`の衝突プロンプトへ到達する前に停止したため`README.md`も無傷のままだった。このため
  **再実行はせず**、`.gitignore`への手動追記（`out`, `dist`, `node_modules`, `.vscode-test/`,
  `*.vsix`。generator-codeの`.gitignore`テンプレートと同内容）と`npm install`のみを手動で行うことで
  完結させた。
- `tsconfig.json`の既定`include`（未指定＝`**/*`）が、`.gitignore`済みでコミット対象外の
  `参考ディレクトリ/`（[directory-structure.md](../../.claude/rules/directory-structure.md)
  「参考ディレクトリの扱い」参照）配下のTypeScriptファイルまで拾ってしまい`npm run compile`が
  `TS6059`エラーで失敗する問題が判明したため、`tsconfig.json`に
  `"exclude": ["node_modules", ".vscode-test", "参考ディレクトリ"]` を追加した。

## 却下した案

- **拡張本体用のサブディレクトリ（例: `extension/`）に生成する案**: README.md/.gitignoreの衝突を
  構造的に避けられるが、単一目的リポジトリ（VS Code拡張部分のみを管理）において不要なネストを
  持ち込むことになる。ユーザーとの確認の結果、「リポジトリ直下に生成し、衝突ファイルは事前退避」を
  採用した（結果的に`.gitignore`側の衝突で処理が停止したため、`README.md`の退避は使わずに済んだ）。
- **`.gitignore`衝突後にyo codeを再実行する案**: `--no-gitInit`に修正して再実行すれば正攻法だが、
  中断時点で必要な生成物（README.md/.gitignore以外）は既に書き込み済みであり、残タスクは
  `.gitignore`への数行追記のみだったため、再実行によるコンフリクト再発リスク（今度は他の生成物との
  衝突が起きる）を避け、手動追記で完結させる方を選んだ。
- **バンドラー（webpack/esbuild）を最初から選定する案**: 実装量に対して判断材料が少ない段階のため
  見送り、generator-codeの既定である`unbundled`（プレーンな`tsc`ビルド）のままとした。
  パッケージング・配布方針が固まった段階で改めて検討する。
