import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorApp } from './EditorApp';

const container = document.getElementById('root');
if (!container) {
	throw new Error('webviewのHTMLに #root 要素が見つかりません（EditorPanelProvider.tsのHTML生成を確認してください）。');
}

createRoot(container).render(
	<React.StrictMode>
		<EditorApp />
	</React.StrictMode>
);
