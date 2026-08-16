import React, { useState } from 'react';
import { getVsCodeApi } from './vscodeApi';

// 拡張ホスト側（EditorPanelProvider.ts の onDidReceiveMessage）と共有するメッセージ種別。
// App.tsx（サイドバー版）と同じ定数値を使う（詳細: plans/floofy-splashing-sparrow.md）。
const MESSAGE_TYPE_SEND_FILE_TO_API = 'sendFileToApi';

export function EditorApp() {
	const [status, setStatus] = useState<string>('');

	const handleSendClick = () => {
		getVsCodeApi().postMessage({ type: MESSAGE_TYPE_SEND_FILE_TO_API });
		setStatus('送信リクエストを送りました（結果は通知でご確認ください）');
	};

	return (
		<div className="app">
			<p>これはメインエディタ領域に表示するReact Webviewサンプルです。現在アクティブなファイルを、右クリックメニューと同じ外部Python APIへ送信します。</p>
			<button onClick={handleSendClick}>現在のファイルを外部APIへ送信</button>
			{status && <p className="status">{status}</p>}
		</div>
	);
}
