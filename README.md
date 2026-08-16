# vscode-gws-extension

VS Code拡張 + Python API + PlaywrightでNotebookLM連携する構成まとめ

これまで話した内容を整理すると、今回作ろうとしているものは、VS Codeをフロントエンドにして、ローカルのPython APIをバックエンドにし、ユーザーのChromeをPlaywrightで操作する構成がかなり相性がよさそうです。

1. 全体構成

┌──────────────────────────────────────────────┐
│                    VS Code                   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ React Webview                          │  │
│  │                                        │  │
│  │ ・NotebookLMへ送る                     │  │
│  │ ・関連ファイル一覧                     │  │
│  │ ・処理結果                             │  │
│  └────────────────┬───────────────────────┘  │
│                   │ postMessage              │
│                   ↓                          │
│  ┌────────────────────────────────────────┐  │
│  │ VS Code Extension                      │  │
│  │ TypeScript                             │  │
│  │                                        │  │
│  │ ・ファイル取得                         │  │
│  │ ・LSP情報取得                          │  │
│  │ ・VS Code操作                          │  │
│  │ ・Python API起動                       │  │
│  └────────────────┬───────────────────────┘  │
└───────────────────┼──────────────────────────┘
                    │ HTTP / WebSocket
                    ↓
          ┌─────────────────────┐
          │ Python API          │
          │ FastAPI             │
          │                     │
          │ ・ファイル処理       │
          │ ・NotebookLM制御     │
          │ ・Playwright        │
          └──────────┬──────────┘
                     │ CDP
                     ↓
          ┌─────────────────────┐
          │ ユーザーのChrome      │
          │ 専用プロファイル       │
          └──────────┬──────────┘
                     ↓
                NotebookLM


---

2. VS Code側はReact Webview

VS CodeのパネルにはReactでUIを作ります。

例えば、

┌─────────────────────────────┐
│ NotebookLM                  │
├─────────────────────────────┤
│                             │
│ 関連ファイル                │
│ ☑ main.ts                   │
│ ☑ user.ts                   │
│ ☑ api.ts                    │
│ ☑ types.ts                  │
│                             │
│ Notebook                    │
│ [My Project ▼]              │
│                             │
│       [NotebookLMに送る]    │
└─────────────────────────────┘

のようなUIです。

Webviewを選ぶ理由

VS Code内に自然に表示できる

VS Codeとの連携が簡単

Electronを別途起動する必要がない

UI部分をReactで開発できる

VS Codeユーザー向けなら配布しやすい


UIだけならElectronよりWebviewを使う方が今回の用途には適しています。


---

3. 重い処理はPython APIに分離

WebviewやExtensionに処理を詰め込まず、

React
 ↓
Extension
 ↓
Python API

とします。

Python側は例えばFastAPI。

localhost:xxxxx
├── /health
├── /analyze
├── /notebook/send
└── ...

などを用意します。

開発中は普通のPythonとして動かし、配布時にはPyInstaller等でEXE化できます。

開発時

Python
 ↓
FastAPI
 ↓
localhost


配布時

my-api.exe
 ↓
FastAPI
 ↓
localhost

ユーザーにPythonをインストールしてもらう必要をなくせます。


---

4. VS Code起動時にPython APIを起動

Extensionのactivate時にPython APIを起動します。

VS Code起動
   ↓
Extension activate
   ↓
my-api.exe起動
   ↓
FastAPI起動
   ↓
/health確認
   ↓
API Ready

ExtensionからNode.jsのchild_processでEXEを起動できます。

また、ポートは固定値より空いているポートを使用する設計の方が安全です。

API起動後に、

API_READY:12345

のようにExtensionへポート番号を通知する方式などが考えられます。


---

5. VS CodeとPython APIの通信

基本は、

Extension
    ↕
HTTP / WebSocket
    ↕
Python API

です。

HTTP

「処理を依頼する」のに向いています。

POST /notebook/send

WebSocket

「APIからVS Codeへイベントを送りたい」場合に向いています。

例えばPython側から、

{
  "action": "open_file",
  "path": "/workspace/src/main.ts",
  "line": 42
}

をExtensionへ送る。

ExtensionがVS Code APIを実行して、

> main.tsを開いて42行目に移動



ということができます。


---

6. Python APIからVS Codeを直接操作するわけではない

重要なのはここです。

❌ Python → VS Code API

ではなく、

⭕ Python
      ↓
   Extension
      ↓
 VS Code API

です。

Extensionが「VS Codeの手足」になります。

例えば、

ファイルを開く

カーソル移動

選択範囲変更

コード変更

ターミナル操作

通知

VS Codeコマンド実行


などをExtensionが担当します。


---

7. VS Codeを閉じたらどうなるか

基本的には、

VS Code
 ↓
Extension終了
 ↓
WebSocket切断

となります。

今回の構成では、Extensionが起動したPython APIも終了させる設計が自然です。

VS Code起動
 ↓
Extension起動
 ↓
Python API起動
 ↓
利用

VS Code終了
 ↓
Extension終了
 ↓
Python API終了

ただし、Python APIを常駐させる設計も可能です。


---

8. WSL対応

Remote - WSLを使う場合は、

Windows
└── VS Code
      ↓
     WSL
      ├── VS Code Server
      ├── Extension Host
      └── Python API

となります。

そのため、ExtensionがWSL側で動くならPython APIもWSL側で動かすのが自然です。

例えば、

Windows VS Code
       ↓
      WSL
       ├── Extension
       └── Python API

です。

Windowsなら、

my-api.exe

WSL/Linuxなら、

my-api

というようにOSごとにAPIバイナリを用意できます。

React側はOSを意識しなくて済むようにできます。


---

9. LSPを使って関連ファイルを探す

今回かなり重要なのがここです。

例えば現在、

main.ts

を編集していたとします。

LSPやAST解析を使って、

main.ts
 ↓
user.ts
api.ts
 ↓
types.ts

という依存関係を取得できます。

そして、

関連ファイル

☑ main.ts
☑ user.ts
☑ api.ts
☑ types.ts
☐ logger.ts

のようにReact UIに表示できます。


---

10. LSPに特別な設定は基本不要

TypeScript/JavaScriptなら、VS Codeに言語機能が標準搭載されています。

Extensionから、

vscode.commands.executeCommand(
    "vscode.executeDefinitionProvider",
    ...
)

などのVS Code APIを使って、

definition

references

implementation

type definition


などの情報を取得できます。

つまり、

ユーザー
 ↓
VS Code
 ↓
TypeScript言語機能
 ↓
あなたのExtension

という関係です。

他言語の場合

PythonならPython用拡張、C++ならC++用拡張など、対応する言語機能が必要になります。

そのため、

TypeScript/JavaScript
→ 追加インストール不要になりやすい

Python/C++/Go等
→ 対応する拡張が必要

と考えるとよいです。


---

11. LSPだけでなくAST/import解析も使う

「関連ファイル」を見つけるなら、LSPだけに依存する必要はありません。

例えば、

import { User } from "./user";
import { Api } from "./api";

をAST解析して、

main.ts
 ├── user.ts
 └── api.ts

を取得できます。

おすすめは、

現在のファイル
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
        LSP                   AST
          │                     │
  definition/references       import
          │                     │
          └──────────┬──────────┘
                     ↓
                関連ファイル

という組み合わせです。

LSPが利用できない場合のフォールバックにもなります。


---

12. 「保存前のコード」もNotebookLMへ送れる

Extensionなら、ファイルそのものを読み込むだけではなく、

editor.document.getText()

で現在エディタに表示されている内容を取得できます。

つまり、

まだ保存していないコード
        ↓
VS Code Extension
        ↓
NotebookLM

も可能です。

これはVS Code拡張にする大きなメリットです。


---

13. NotebookLMへの連携

今回想定しているUXは、

VS Code Explorer
       ↓
ファイルを選択
       ↓
右クリック
       ↓
「NotebookLMに送る」

です。

Extensionが、

[
  "src/main.ts",
  "src/user.ts",
  "src/api.ts"
]

を取得。

↓

Python APIへ渡す。

↓

PlaywrightでNotebookLMを操作。

↓

選択したファイルをSourceとして追加。

という流れです。


---

14. NotebookLM操作はPlaywright

ここではChromiumをアプリに同梱せず、ユーザーのChromeを利用する案が有力です。

Python
 ↓
Playwright
 ↓
ユーザーのChrome
 ↓
CDP
 ↓
NotebookLM

Playwrightは、

connect_over_cdp()

で既に起動しているChromeに接続できます。


---

15. Googleログイン

GoogleのID・パスワードをアプリに入力させるのではなく、

専用Chrome起動
      ↓
Googleログイン画面
      ↓
ユーザー自身がログイン
      ↓
ログイン状態をChrome Profileに保持
      ↓
Playwrightが同じChromeに接続

という方式が適切です。

専用Chrome Profileがおすすめ

普段使っているChromeではなく、

Chrome
└── MyApp専用Profile
     ├── Googleログイン
     └── NotebookLMログイン

とします。

普段のChromeには、

Gmail

Drive

その他のCookie

セッション情報


などが入っているため、そこをCDPで公開するのは避けたほうが安全です。


---

16. Chromiumを配布しなくてよい

この方式なら、

配布するもの

VS Code Extension
Python API
Playwright

で済み、

❌ Playwright Chromiumを同梱

する必要がありません。

ユーザーPCにあるChromeを利用します。

そのため、アプリサイズを抑えられます。


---

17. WebviewをCDPで直接操作する案

一方、

VS Code Webview
└── NotebookLM
       ↑
       │ CDP
       │
Playwright

という構成は、通常のWebページ + Chromeタブのようには扱えません。

VS Code Webviewは通常のChromeタブではないため、WebviewそのものをCDP経由でPlaywrightから操作する設計はおすすめしません。

NotebookLMのブラウザ表示と自動操作を同じChromiumで行いたいなら、Electronなどの方が自然です。

ただし今回の目的なら、

VS Code Webview
→ 操作パネル

Chrome
→ NotebookLM表示

Playwright
→ Chrome操作

と分離する方がシンプルです。


---

18. 最終的なUX

最終的には、例えばこうできます。

VS Code

┌─────────────────────────────────────────┐
│ Explorer       Editor         NotebookLM│
│                                         │
│ src/            main.ts        Sources  │
│ ├─ main.ts      ──────────     ☑main.ts│
│ ├─ user.ts                     ☑user.ts│
│ ├─ api.ts                      ☑api.ts │
│ └─ types.ts                            │
│                                         │
│                               [送る]    │
└─────────────────────────────────────────┘

ユーザーが、

「NotebookLMに送る」

を押す。

すると、

ファイル選択
    ↓
LSP / ASTで関連ファイル取得
    ↓
Reactで確認
    ↓
Extension
    ↓
Python API
    ↓
Playwright
    ↓
ユーザーのChrome
    ↓
NotebookLM
    ↓
Source追加

となります。

さらに逆方向も可能です。

NotebookLM
   ↓
Playwright
   ↓
Python API
   ↓
Extension
   ↓
VS Code

として、

NotebookLMの回答をパネルに表示

回答をファイルに保存

該当ファイルを開く

該当行へジャンプ

コード修正を適用


などに発展できます。


---

19. 現時点でのおすすめ構成

最終的にはこれが一番バランスが良いと思います。

┌────────────────────────────────────────────┐
│                    VS Code                 │
│                                            │
│  React Webview                             │
│       │                                    │
│       ↓                                    │
│  VS Code Extension                         │
│       │                                    │
│       ├── VS Code API                      │
│       ├── LSP情報取得                       │
│       ├── AST/import解析                    │
│       ├── ファイル取得                       │
│       └── Python API起動                    │
│                    │                       │
└────────────────────┼───────────────────────┘
                     │
                HTTP/WebSocket
                     │
                     ↓
             ┌────────────────┐
             │ Python / FastAPI│
             │                │
             │ Playwright     │
             └───────┬────────┘
                     │
                    CDP
                     ↓
             ┌────────────────┐
             │ User's Chrome  │
             │ 専用Profile      │
             └───────┬────────┘
                     ↓
                NotebookLM

役割分担

コンポーネント	担当

React Webview	UI
VS Code Extension	VS Code操作・LSP・ファイル取得
Python/FastAPI	重い処理・API・Playwright
Chrome	Googleログイン・NotebookLM表示
Playwright	NotebookLM自動操作
LSP/AST	関連ファイル検出
WebSocket	Python → Extensionのイベント通知


この構成なら、Electronを使わず、Chromiumも配布せず、VS Codeの操作性を維持しながらNotebookLMと連携するという、当初の要件をかなりきれいに満たせます。
