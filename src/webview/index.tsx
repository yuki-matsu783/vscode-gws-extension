import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
	throw new Error('webviewのHTMLに #root 要素が見つかりません（SidebarViewProvider.tsのHTML生成を確認してください）。');
}

createRoot(container).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
