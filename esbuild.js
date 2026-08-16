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
	entryPoints: ['src/webview/index.tsx'],
	bundle: true,
	outfile: 'out/webview/main.js',
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
