---
title: worklog（yo code雛形作成）
type: log
description: issue #2対応のworklog。yo code(generator-code)によるTypeScript拡張機能雛形作成の試行錯誤ログ
tags: [worklog, vscode-extension, yo-code]
keywords: [yo code, generator-code, TypeScript, README, gitignore, npm install]
---

# worklog: smooth-sauteeing-sunbeam

対象: issue #2「VSCODEの拡張機能を作成するためのfirst stepを行う」— `yo code`（generator-code）による
TypeScript拡張機能の雛形作成（2026-08-16）。
plan: `plans/smooth-sauteeing-sunbeam.md`

## 試したこと

- Plan策定前に `microsoft/vscode-generator-code` のソース（`generate-command-ts.js`, `prompts.js`,
  `templates/ext-command-ts/*`）をWebFetchで確認し、`-q`（quick）モードでの各オプションの
  デフォルト挙動・生成ファイル一覧・`.gitignore`テンプレート内容を事前に特定した。
- `npx --yes --package yo --package generator-code -- yo code . -t=ts --pkgManager=npm --gitInit=false -q < /dev/null`
  を実行。

## うまくいったこと

- `--gitInit=false` を指定すると `.gitignore` 自体が生成されないことが判明したため、既存ファイルとの
  衝突は実質 `README.md` のみに絞り込めた（`.gitignore`は既存のものへ手動追記する方針で対応可能）。
- `.gitignore`衝突プロンプトでプロセスが中断した後も、README.md以前に書き込みキュー順で
  処理される他の全生成物（`package.json`, `.vscode/`, `tsconfig.json`, `.vscodeignore`, `CHANGELOG.md`,
  `src/`, `eslint.config.mjs`, `.vscode-test.mjs`, `vsc-extension-quickstart.md`）は正常に書き込まれて
  いたため、再実行はせず手動で`.gitignore`追記＋`npm install`のみ行うことで完結できた
  （結果的に事前退避したREADME.md.origは使わずに済んだ＝README.mdは無傷）。
- `npm run compile` / `npm run lint` とも成功。`.vscode/launch.json`に "Run Extension"
  （F5でのExtension Development Host起動）設定を確認。

## ダメだったこと

- **`--gitInit=false` が効かず`.gitignore`が生成されようとした**: generator-codeのソース
  （`prompts.js`のaskForGit）は `typeof gitInit === 'boolean'` を要求するが、yargsは
  `--gitInit=false` を文字列 `"false"` としてパースするため判定に失敗し、quickモードの既定値
  `gitInit=true` にフォールバックしていた（推定。ソース調査時点ではboolean変換される前提だったが
  実機では再現しなかった）。結果、既存の`.gitignore`との衝突プロンプトが発生し、stdinを
  `/dev/null`にリダイレクトしていたため即座にEOFでプロセスが強制終了した。
  **教訓**: yargsのboolean optionに`=false`形式で渡すのは信頼できない。`--no-gitInit`
  （yargsの標準的なboolean否定構文）を使うべきだった。ただし今回は結果的にこの中断のおかげで
  `.gitignore`もREADME.mdも上書きされずに済んだため、実害はなかった。
- `tsconfig.json`の既定`include`（明示指定なし＝`**/*`）が`参考ディレクトリ/`配下のファイルまで
  拾ってしまい、初回`npm run compile`が`TS6059`エラーで失敗した。`tsconfig.json`に
  `"exclude": ["node_modules", ".vscode-test", "参考ディレクトリ"]`を追記して解消。

## 次の一歩

- 特になし（完了）。ドキュメントTODO解消（`.claude/rules/directory-structure.md`, `DEVELOPERS.md`,
  `index.md`）まで完了。issue-mr-flowのステップ12（commit・push・レビュー依頼）へ進む。
- `.claude/skills/vscode-extension-implement/SKILL.md` /
  `.claude/agents/vscode-extension-code-reviewer.md` のTODO解消は本issueのスコープ外。次issue候補として
  HANDOFF.mdに書き添える。

---
