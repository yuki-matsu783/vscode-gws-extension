// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// 右クリックメニューからのリクエスト送信先（POST {apiBaseUrl}/analyze）。エンドポイントの正式な契約は
// Python API側（別リポジトリ、スコープ外）が決まり次第見直す。詳細: plans/zazzy-foraging-meerkat.md
const API_REQUEST_PATH = '/analyze';
const API_REQUEST_TIMEOUT_MS = 5000;
const RESPONSE_PREVIEW_LENGTH = 200;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-gws-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const helloWorldDisposable = vscode.commands.registerCommand('vscode-gws-extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-gws-extension!');
	});

	const sendFileToApiDisposable = vscode.commands.registerCommand(
		'vscode-gws-extension.sendFileToApi',
		(uri?: vscode.Uri, uris?: vscode.Uri[]) => sendFileToApi(uri, uris)
	);

	context.subscriptions.push(helloWorldDisposable, sendFileToApiDisposable);
}

// エディタ/エクスプローラーの右クリックメニューから呼ばれるサンプルコマンド。選択ファイルのパスを
// ローカルPython API（README想定のFastAPI）へPOST送信する。詳細・未決定事項:
// plans/zazzy-foraging-meerkat.md
async function sendFileToApi(uri?: vscode.Uri, uris?: vscode.Uri[]): Promise<void> {
	if (uris && uris.length > 1) {
		vscode.window.showInformationMessage(
			'複数選択時は先頭のファイルのみ送信します（サンプル実装の制約）。'
		);
	}

	const targetUri = uri ?? uris?.[0] ?? vscode.window.activeTextEditor?.document.uri;
	if (!targetUri) {
		vscode.window.showWarningMessage('送信対象のファイルを特定できませんでした。');
		return;
	}

	const relativePath = vscode.workspace.asRelativePath(targetUri);
	const apiBaseUrl = vscode.workspace
		.getConfiguration('vscode-gws-extension')
		.get<string>('apiBaseUrl', 'http://localhost:8000');
	const endpoint = `${apiBaseUrl}${API_REQUEST_PATH}`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

	try {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: relativePath }),
			signal: controller.signal,
		});

		if (!res.ok) {
			vscode.window.showErrorMessage(
				`外部APIへの送信に失敗しました（HTTP ${res.status}）。ローカルでPython APIが起動しているか確認してください。`
			);
			return;
		}

		let bodyPreview: string;
		try {
			bodyPreview = JSON.stringify(await res.json());
		} catch {
			bodyPreview = await res.text();
		}
		if (bodyPreview.length > RESPONSE_PREVIEW_LENGTH) {
			bodyPreview = `${bodyPreview.slice(0, RESPONSE_PREVIEW_LENGTH)}...`;
		}
		vscode.window.showInformationMessage(`外部APIへ送信しました: ${relativePath} → ${bodyPreview}`);
	} catch (err) {
		const reason = err instanceof Error && err.name === 'AbortError'
			? 'タイムアウトしました'
			: err instanceof Error ? err.message : String(err);
		vscode.window.showErrorMessage(
			`外部APIへの接続に失敗しました（${reason}）。ローカルでPython APIが起動しているか確認してください。`
		);
	} finally {
		clearTimeout(timeout);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
