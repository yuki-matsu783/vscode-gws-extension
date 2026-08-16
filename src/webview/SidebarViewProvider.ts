import * as vscode from 'vscode';

// サイドバー（Activity Bar）に表示するReact Webviewサンプル。
// ボタン押下 → postMessage → 既存の vscode-gws-extension.sendFileToApi コマンドを実行する、という
// 最小限のメッセージパッシングのみを扱う。fetch実装自体は再利用し、ここでは持たない
// （詳細: docs/spec/右クリックで外部APIへリクエストを送信する.md, plans/imperative-purring-tarjan.md）。

// webview → 拡張ホストへ送るメッセージの型。src/webview/App.tsx の MESSAGE_TYPE_SEND_FILE_TO_API と対応する。
interface WebviewMessage {
	type: 'sendFileToApi';
}

export class SidebarViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.html = this.getHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
			if (message.type === 'sendFileToApi') {
				void vscode.commands.executeCommand('vscode-gws-extension.sendFileToApi');
			}
		});
	}

	private getHtml(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'main.js')
		);
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
}

function getNonce(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
}
