import React, { useState } from 'react';
import { getVsCodeApi } from './vscodeApi';

// 拡張ホスト側（SidebarViewProvider.ts の onDidReceiveMessage）と共有するメッセージ種別。
// 型を独立ファイルに切り出すほどの規模ではないため、両ファイルにこの定数文字列をそのまま書く
// （詳細: plans/imperative-purring-tarjan.md）。
const MESSAGE_TYPE_SEND_FILE_TO_API = 'sendFileToApi';

export function App() {
	const [status, setStatus] = useState<string>('');

	const handleSendClick = () => {
		getVsCodeApi().postMessage({ type: MESSAGE_TYPE_SEND_FILE_TO_API });
		setStatus('送信リクエストを送りました（結果は通知でご確認ください）');
	};

	return (
		<div className="app">
			<p>現在アクティブなファイルを、右クリックメニューと同じ外部Python APIへ送信します。</p>
			<button onClick={handleSendClick}>現在のファイルを外部APIへ送信</button>
			{status && <p className="status">{status}</p>}
		</div>
	);
}
