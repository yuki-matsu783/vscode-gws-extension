import * as vscode from 'vscode';

// WebviewView（サイドバー）・WebviewPanel（メインエディタ領域）の両方で共有する、
// CSP/nonceベースのHTML生成ユーティリティ。CSPを含むセキュリティ関連コードのため、
// 呼び出し元ごとにコピーせずここへ集約する（詳細: docs/ddr/0005-メインエディタReact-Webviewサンプルの技術構成を決める.md）。

// webviewのHTMLシェルを生成する。scriptPathSegmentsは extensionUri からのパスセグメント
// （例: ['out', 'webview', 'main.js']）。
export function getWebviewHtml(
	webview: vscode.Webview,
	extensionUri: vscode.Uri,
	scriptPathSegments: string[]
): string {
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...scriptPathSegments));
	const nonce = getNonce();

	return /* html */ `<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
	<div id="root"></div>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
}
