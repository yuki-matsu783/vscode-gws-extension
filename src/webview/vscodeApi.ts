// webview内から拡張ホストへメッセージを送るための acquireVsCodeApi() ラッパー。
// acquireVsCodeApi() はwebview 1インスタンスにつき1回しか呼べない（2回目以降は例外を投げる）ため、
// モジュールスコープで1度だけ呼び出し、以降はこのシングルトンを使い回す。

interface VsCodeApi {
	postMessage(message: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

let cachedApi: VsCodeApi | undefined;

export function getVsCodeApi(): VsCodeApi {
	if (!cachedApi) {
		cachedApi = acquireVsCodeApi();
	}
	return cachedApi;
}
