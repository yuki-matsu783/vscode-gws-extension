import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('コマンドが登録されている', async () => {
		// activationEvents が空のため、コマンド未実行の状態では拡張が未activateのままになり
		// getCommands() にも自身のコマンドが現れない。明示的にactivateしてから確認する。
		const ext = vscode.extensions.all.find((e) => e.packageJSON.name === 'vscode-gws-extension');
		await ext?.activate();

		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('vscode-gws-extension.helloWorld'));
		assert.ok(commands.includes('vscode-gws-extension.sendFileToApi'));
	});

	test('サイドバーwebview viewが定義されている', () => {
		// webview自体の描画（React部分）はCIでは検証しない（F5での目視確認に委ねる。
		// 詳細: docs/spec/右クリックで外部APIへリクエストを送信する.md「テストはコマンド登録の確認のみ」）。
		// ここではpackage.jsonのmanifest定義のtypo等を防ぐ静的チェックのみ行う。
		const ext = vscode.extensions.all.find((e) => e.packageJSON.name === 'vscode-gws-extension');
		const views = ext?.packageJSON.contributes?.views?.['vscode-gws-extension-sidebar'];
		assert.ok(
			Array.isArray(views) && views.some((v: { id: string }) => v.id === 'vscode-gws-extension.sidebarView')
		);
	});
});
