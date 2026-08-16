---
name: vscode-extension-implement
description: "TODO: vscode-gws-extension（VS Code拡張、TypeScript）で新機能の追加や既存動作の変更を行うときに使うサブフロー。.claude/skills/issue-mr-flow/SKILL.mdから呼ばれる想定だが、ソースコード・コーディング規約が未確定のため現時点では中身が定義されていない。"
title: vscode-gws-extension 実装フロー（TODO）
type: skill
tags: [implement, skill, todo]
keywords: [設計ドキュメント, docs-spec, planモード, worklog, handoff, issue-mr-flow, typescript, コーディング規約]
---

# vscode-gws-extension 実装フロー（TODO）

**このスキルは現時点では未策定のプレースホルダーです。** `.claude/skills/issue-mr-flow/SKILL.md`
（唯一の実装フロー定義）の全体フローのうち、「設計ドキュメント作成〜実装」ステップをvscode-gws-extension
（VS Code拡張、TypeScript/React Webview）向けに実行手順へ落とし込む役割を持つ想定だが、着手時点では
ソースコード自体が存在せず、コーディング規約（命名規則・ディレクトリ構成・エラーハンドリング方針等）も
未確定のため、中身は定義していない。

## 未策定である理由

- 拡張本体（`src/`, `package.json`等）のディレクトリ構成が未確定（`.claude/rules/directory-structure.md`
  のTODO節参照）。
- TypeScript/React Webviewのコーディング規約（`.claude/rules/`配下に相当ファイルが無い）が未策定。
- ビルド・パッケージング方針（`vsce package`等）も未確定。

これらを実装が進む前に先回りして規約化すると、実態と乖離したルールが残るリスクがあるため、
今回のAI開発資産移植では意図的に整備を見送った（経緯:
[docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 整備するときの参考（ひな形）

移植元プロジェクトの `ahk-implement` スキル（AutoHotkey向けの同種スキル）は、以下の構成だった。
本スキルを整備する際は、この構成をTypeScript/VS Code拡張向けに読み替えることを想定する。

1. **設計ドキュメントを作成する**: `docs/spec/機能名.md` を、既存specと同じ章立て
   （背景・目的／仕様／影響範囲／設定項目／未決定事項・懸念点）で新規作成する。
2. **人間の承認を得る**: 明示的な承認を得るまでコードの実装には着手しない。
3. **方針を計画する**: featureブランチを作成し、Planモードで手順を作成・`plans/`へ出力、
   `worklog/日付_<plan名>.md`を作成する。
4. **実装する**: コーディング規約（未策定。将来 `.claude/rules/<何か>-style.md` 相当を作る）に従う。
   エントリポイントとなるファイルの冒頭に設計ドキュメントへの参照コメントを入れる。
5. **整合性を維持する**: 実装完了後、設計反映（`docs/spec/`の上書き・`docs/ddr/`への記録・
   `worklog/`削除・`HANDOFF.md`リセット）を行ってからPRを作成する。

TypeScript/VS Code拡張のコーディング規約・ディレクトリ構成が決まり次第、上記を具体的な手順として
書き起こすこと。

## 実装中に判明した具体的な知見（本格整備前の暫定メモ）

コーディング規約としての正式な体系化はまだ早いが、issue #4（右クリックメニュー→外部APIへの
サンプル送信、詳細: [docs/spec/右クリックで外部APIへリクエストを送信する.md](../../../docs/spec/右クリックで外部APIへリクエストを送信する.md)）
の実装で判明した、再現性のある具体的な注意点を記録する。

- **`package.json`の`activationEvents`が空配列（`[]`）の場合、`contributes.commands`から暗黙の
  活性化イベントが推測されるが、それはコマンドが実際に実行されたとき（メニュー選択・パレット実行・
  `executeCommand`呼び出し等）に発火する。** `vscode.commands.getCommands(true)`
  を呼ぶだけでは拡張は活性化されない（VS Code側がコマンドIDをUI表示用にmanifestから読んでいるだけで、
  実際のコマンドレジストリへの登録は拡張の`activate()`実行後に行われるため）。
  - このため、「新しいコマンドが登録されていること」を確認する単体テスト
    （`src/test/extension.test.ts`）を書く場合、事前に明示的な活性化が必要:
    ```typescript
    const ext = vscode.extensions.all.find((e) => e.packageJSON.name === '<package.jsonのname>');
    await ext?.activate();
    ```
  - この対策をせずに`getCommands(true)`だけで判定すると、既存コマンド（`helloWorld`等）も含めて
    テストが失敗する（issue #4対応時に実機確認済み。`worklog/`はマージ時に削除される運用のため、
    詳細な経緯が必要な場合はコミット履歴（issue #4のfeatureブランチ）を参照）。
- 新規コマンドを右クリックメニュー（`editor/context` / `explorer/context`）に追加する際は、
  `package.json`の`contributes.menus`にエントリを追加し、誤爆防止のため`"when": "resourceScheme == file"`
  等の`when`句を検討する。コマンドハンドラは`(uri?: vscode.Uri, uris?: vscode.Uri[])`のシグネチャで
  受け、`uri`未指定時は`vscode.window.activeTextEditor`へフォールバックするパターンが再利用できる
  （詳細実装: `src/extension.ts`の`sendFileToApi`）。
- HTTPクライアントは新規ライブラリ（axios等）を追加せずとも、`tsconfig.json`の`lib: ES2022` +
  `@types/node`（24.x時点で確認）によりグローバル`fetch`が型付きで利用可能。ローカルAPIへの
  リクエストのような単純なユースケースでは、まずこれで足りるか検討する。
