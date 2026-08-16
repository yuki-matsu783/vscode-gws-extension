---
title: 0005. メインエディタReact Webviewサンプルの技術構成を決める
type: ddr
description: issue #7対応。メインエディタ領域に表示するReact Webviewサンプル（WebviewPanel方式）の、シングルトン管理・CSP共通化・esbuildエントリポイント分割に関する決定を記録したDDR
tags: [ddr, vscode-extension, react, webview, webview-panel, esbuild]
keywords: [WebviewPanel, createWebviewPanel, CatCodingPanel, EditorPanelProvider, ViewColumn, retainContextWhenHidden, getWebviewHtml, esbuild]
---

# 0005. メインエディタReact Webviewサンプルの技術構成を決める

## 背景

issue #7「reactでメインエディタ領域のwebviewサンプルを作成する」は、issue #6と同様に本文が未記入
（目的・現状・期待する動作・受け入れ条件のいずれも未記載）の状態で着手することになった。着手前に
ユーザーへ確認したところ、issue #6（サイドバーReact Webviewサンプル、
[DDR 0004](0004-サイドバーReact-Webviewサンプルの技術構成を決める.md)）のパターンをそのまま踏襲した
最小サンプルとして進める方針で合意を得た。

issue #6は`vscode.WebviewViewProvider`（サイドバー常駐、VS Code側がインスタンスを一元管理する）
方式だったのに対し、issue #7では`vscode.window.createWebviewPanel`（コマンドから開くメインエディタ
領域のタブ）方式を新規に扱う必要があり、DDR 0004では検討していなかった論点が生じた。

## 決定

1. **`vscode.window.createWebviewPanel`によるシングルトン管理は、VS Code公式`webview-sample`の
   `CatCodingPanel`パターン（`createOrShow`静的ファクトリ＋`currentPanel`静的参照＋
   `onDidDispose`での解放）を採用する。** `WebviewViewProvider`と異なり`createWebviewPanel`は
   VS Code側がインスタンスを一元管理してくれないため、拡張側で明示的にシングルトン化する
   必要がある。公式サンプルの実績あるパターンをそのまま採用し、独自設計は行わない。
2. **`SidebarViewProvider`と`EditorPanelProvider`が共有するCSP/nonce生成ロジックを
   `src/webview/getWebviewHtml.ts`に抽出する。** CSPを含むセキュリティ関連コードが2箇所目の
   実装を必要とする時点でコピーすると、「片方だけCSP設定を更新し忘れる」ドリフトのリスクが
   生じるため、共通ユーティリティとして切り出した。`SidebarViewProvider.ts`側の実装も
   このユーティリティを使うよう変更し、CSP文字列・HTML構造自体は変更していない。
3. **esbuildの`entryPoints`を`src/webview/index.tsx`（サイドバー）と
   `src/webview/editorPanelIndex.tsx`（エディタパネル）の2つに分離し、それぞれ独立したバンドル
   （`main.js`/`editorPanel.js`）として1回のビルドで出力する。** `entryPoints`を配列オブジェクト
   形式に変更するだけで実現でき、既存の`main.js`という出力名は`out: 'main'`指定で維持したため、
   `SidebarViewProvider.ts`側への影響は無い。
4. **`ViewColumn`は`activeTextEditor?.viewColumn ?? ViewColumn.One`、
   `retainContextWhenHidden`は指定しない（`false`相当）を採用する。** 現在アクティブな
   エディタ列に開く方が固定`ViewColumn.One`より自然な挙動であり、本サンプルはボタン押下直後の
   一時的なステータス文言のみを保持するため、非表示→再表示時に状態がリセットされても実害が無い
   （メモリを常時保持するコストをかけるほどのサンプルではないと判断した）。

## 却下した案

- **`App.tsx`をpropsで`EditorApp.tsx`と共有する案**: `title`/`description`等をパラメータ化して
  1つのコンポーネントを両entry pointから使い回す案も検討したが、消費者が2つしかない時点での
  パラメータ化は時期尚早な抽象化と判断した。それぞれが対応するProviderと1:1で完結している方が、
  issue #6のペアリング（1 provider＝1 entry point＝1 component）との一貫性・可読性が高い。
- **単一バンドルを共有し、実行時フラグでマウントするコンポーネントを切り替える案**:
  HTMLに埋め込んだグローバル変数等でサイドバー用/エディタパネル用のコンポーネントを実行時に
  切り替える案も検討したが、この規模のサンプルでは分離バンドルの方が単純でentry pointの責務が
  明確なため採用しなかった。
- **`retainContextWhenHidden: true`を明示的に指定する案**: パネル非表示中も状態を保持できるが、
  本サンプルの性質上不要な複雑さを加えるだけと判断し見送った。
