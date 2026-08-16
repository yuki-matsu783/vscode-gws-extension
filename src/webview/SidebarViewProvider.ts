import * as vscode from 'vscode';
import { getWebviewHtml } from './getWebviewHtml';

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

		webviewView.webview.html = getWebviewHtml(webviewView.webview, this.extensionUri, ['out', 'webview', 'main.js']);

		webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
			if (message.type === 'sendFileToApi') {
				void vscode.commands.executeCommand('vscode-gws-extension.sendFileToApi');
			}
		});
	}
}
