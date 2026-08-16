---
title: frontmatter抽出スクリプト（extract-frontmatter.sh）
type: spec
description: markdownのYAML frontmatterを抽出しindex.jsonlとして出力するdev-toolスクリプトの仕様
tags: [extract-frontmatter, jsonl, spec]
keywords: [frontmatter, jsonl, concept-id, リポジトリルート, yq, 抽出スクリプト]
---

# frontmatter抽出スクリプト（extract-frontmatter.sh）

## 背景・目的

リポジトリ内のmarkdown frontmatterを機械可読な形で一覧化したいという要望を受けて用意した。
指定ディレクトリ配下のmarkdownファイルからYAML frontmatterのみを抽出し、1行1JSON（
[JSON Lines](https://jsonlines.org/)）の`index.jsonl`として出力する。`.claude/rules/markdown-frontmatter.md`
が定めるOKF風frontmatterの機械可読なインデックスとして、将来的な検索・ツール連携の基盤にする
位置づけ。

本スクリプトは、参考プロジェクト（Claude Codeによるissue駆動開発フローが成熟していた別プロジェクト）
の資産を汎用化した上で移植したもの（経緯: [docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md](../../../docs/ddr/0001-参考プロジェクトからAI開発資産を移植.md)）。

## 仕様

### 実行方法

```bash
bash dev-tools/src/extract-frontmatter.sh <directory>
```

指定ディレクトリ配下を再帰的に走査する。リポジトリルートで`.`を指定すると、markdownを含む全
ディレクトリの`index.jsonl`を一括生成できる。

### 出力単位

**markdownファイルが直下に存在するディレクトリ毎**に、そのディレクトリ自身へ`index.jsonl`を
出力する（既存があれば上書き）。1回の実行で複数ファイルが生成されうる。指定ディレクトリ配下に
サブディレクトリがあり、それぞれにmarkdownが存在する場合、サブディレクトリごとに個別の
`index.jsonl`が作られる（親ディレクトリの`index.jsonl`へ子ディレクトリ分を集約することはしない）。

### 出力フォーマット

1行1JSON、各行は以下の形式。

```json
{"concept_id": "docs/spec/example-feature", "directory": "docs/spec", "frontmatter": {...}, "mtime": "2026-08-16T10:14:49"}
```

- `concept_id`: **gitリポジトリのルートからの相対パス**から`.md`拡張子を除いたもの。
  実行時に指定したディレクトリではなく、常にリポジトリルートを基準にする（例:
  `docs/`を指定して実行しても、`docs/spec/example-feature.md`の`concept_id`は
  `docs/spec/example-feature`のままになる。`spec/example-feature`にはならない）。
- `directory`: `concept_id`と同じくリポジトリルート基準の、そのファイルが属するディレクトリの
  相対パス。
- `frontmatter`: frontmatterをJSONオブジェクト化したもの。frontmatterが無いファイルは`null`。
- `mtime`: ファイルの最終更新日時（ISO 8601、タイムゾーン省略。ローカルタイムゾーンで算出）。

### frontmatterのYAML→JSON変換

- `yq`（[mikefarah/yq](https://github.com/mikefarah/yq)）がPATH上にあれば優先的に使い、フル
  YAML文法に対応した変換を行う。
- `yq`が無い、または変換に失敗した場合は、本リポジトリのfrontmatterスキーマ
  （単純なスカラー値・フロー配列`[a, b, c]`・ブロック配列`- item`のみ）に絞った自前の軽量パーサー
  （`frontmatter_block_to_json`関数）へフォールバックする。`yq`を新規の必須外部依存にはしない。

### リポジトリルートの解決

`concept_id`/`directory`の基準となるリポジトリルートは`resolve_repo_root`関数で解決する。
`git rev-parse --show-toplevel`と`realpath`が返すパス表記の差異（後述）を吸収するため、
指定ディレクトリへ`cd`したうえで`git rev-parse --show-toplevel`の結果へ再度`cd`し、`pwd`で
一貫した表記のパスを取得する（`git rev-parse --show-toplevel`はWindowsドライブレター形式
（`C:/...`）で返るため、`realpath --relative-to`の基準に使うと表記が一致せず相対パス計算が
失敗する。`cd`はどちらの表記も受け付けるため、一度`cd`してから`pwd`で一貫したMSYS形式を取得する）。

### 文字コード

jqの出力を直接ファイルへ書き出す箇所は`tr -d '\r'`でLF改行に統一している（Windows版native jq
バイナリが行末にCRを付与することがあるため。詳細: `.claude/rules/shell-script-style.md`「文字コード」節）。

## 影響範囲

- `dev-tools/src/extract-frontmatter.sh`
- `tests/test_extract_frontmatter.sh`（`frontmatter_to_json`のYAML→JSON変換、
  `resolve_repo_root`によるリポジトリルート解決、concept_id/directoryの導出ロジックの単体テスト）
- 本ドキュメント
- 各種`index.jsonl`（markdownを含む各ディレクトリに生成される。git管理下）

## 設定項目

新規の`Settings`値は不要（本スクリプトはアプリ本体ではなくdev-tool）。

## 未決定事項・懸念点

- **生成物の自動再生成は未導入**: markdownやfrontmatterが変わるたびに、リポジトリルートで
  `extract-frontmatter.sh .`を手動で再実行し、`index.jsonl`群を更新する必要がある。git hook等での
  自動化は今回のスコープ外。
- **`yq`の動作検証は未実施**: 開発機に`yq`がインストールされていないため、`yq`優先パスの実機動作
  確認は行えていない（フォールバック経路のみ動作確認済み）。`yq`をインストールした環境での
  動作確認は今後の課題。
- **git bash（MSYS）以外での動作は未検証**: `resolve_repo_root`の`cd`によるパス表記統一は
  git bash（Windows）特有の問題への対処であり、WSL/Linux実機での動作確認は行っていない
  （`dev-tools/docs/spec/shell-scripts.md`の未決定事項と同様の制約）。
