import * as vscode from 'vscode';
import { getWebviewHtml } from './getWebviewHtml';

// メインエディタ領域（WebviewPanel）に表示するReact Webviewサンプル。
// SidebarViewProvider.ts と同様、ボタン押下 → postMessage → 既存の
// vscode-gws-extension.sendFileToApi コマンドを実行する、という最小限のメッセージパッシングのみを扱う
// （詳細: plans/floofy-splashing-sparrow.md, docs/ddr/0005-メインエディタReact-Webviewサンプルの技術構成を決める.md）。
//
// vscode.window.createWebviewPanel はVS Code側がインスタンスを一元管理してくれる
// WebviewViewProvider と異なり、拡張側でシングルトン管理を行う必要がある。
// VS Code公式サンプル（webview-sample の CatCodingPanel）のパターンに準拠する。

// webview → 拡張ホストへ送るメッセージの型。src/webview/EditorApp.tsx の
// MESSAGE_TYPE_SEND_FILE_TO_API と対応する。
interface WebviewMessage {
	type: 'sendFileToApi';
}

export class EditorPanelProvider {
	public static currentPanel: EditorPanelProvider | undefined;
	private static readonly viewType = 'vscode-gws-extension.editorPanel';

	private readonly panel: vscode.WebviewPanel;
	private readonly disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri): void {
		const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

		if (EditorPanelProvider.currentPanel) {
			EditorPanelProvider.currentPanel.panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			EditorPanelProvider.viewType,
			'GWS メインエディタサンプル',
			column,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			}
		);

		EditorPanelProvider.currentPanel = new EditorPanelProvider(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.panel = panel;
		this.panel.webview.html = getWebviewHtml(this.panel.webview, extensionUri, ['out', 'webview', 'editorPanel.js']);

		this.panel.webview.onDidReceiveMessage(
			(message: WebviewMessage) => {
				if (message.type === 'sendFileToApi') {
					void vscode.commands.executeCommand('vscode-gws-extension.sendFileToApi');
				}
			},
			null,
			this.disposables
		);

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
	}

	private dispose(): void {
		EditorPanelProvider.currentPanel = undefined;
		this.panel.dispose();
		while (this.disposables.length) {
			this.disposables.pop()?.dispose();
		}
	}
}
