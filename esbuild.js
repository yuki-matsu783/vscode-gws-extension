// webview（React）バンドル用のビルドスクリプト。拡張ホスト側（src/extension.ts等）は
// 引き続き `tsc -p ./` でコンパイルするため対象外（詳細: plans/imperative-purring-tarjan.md）。
//
// 使い方:
//   node esbuild.js          # 1回ビルド
//   node esbuild.js --watch  # 監視ビルド（npm run watch:webview）
const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
	entryPoints: [
		// サイドバー（WebviewViewProvider）用。出力名は既存の main.js を維持する。
		{ in: 'src/webview/index.tsx', out: 'main' },
		// メインエディタ領域（WebviewPanel）用。
		{ in: 'src/webview/editorPanelIndex.tsx', out: 'editorPanel' },
	],
	bundle: true,
	outdir: 'out/webview',
	platform: 'browser',
	format: 'iife',
	target: 'es2022',
	jsx: 'automatic',
	sourcemap: true,
	minify: false,
	logLevel: 'info',
};

async function main() {
	if (watch) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
	} else {
		await esbuild.build(buildOptions);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
