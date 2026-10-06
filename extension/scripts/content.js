(() => {
	const MSG_GET_IMAGE = "IMAGE_GET";
	const HOST_KEY = `hostImage:${location.hostname}`;
	const PAGE_KEY = `pageImage:${location.hostname}:${location.pathname}`;
	const ENABLED_KEY = `hostEnabled:${location.hostname}`;
	const OPACITY_KEY = `hostOpacity:${location.hostname}`;
	const THUMB_KEY = `hostThumb:${location.hostname}`;

	let objectUrl = null;
	let runId = 0;
	let styleElement = null;

	function clear() {
		if (objectUrl) {
			URL.revokeObjectURL(objectUrl);
			objectUrl = null;
		}
		if (styleElement) {
			styleElement.remove();
			styleElement = null;
		}
	}

	function mount(url, opacity = 0.2) {
		if (!styleElement) {
			styleElement = document.createElement("style");
			// Vì content script chạy ở document_start, head có thể chưa có
			const parent = document.head || document.documentElement;
			parent.appendChild(styleElement);
		}

		styleElement.innerHTML = `
        body::after {
            content: "";
            display: block;
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            pointer-events: none;
            background-image: url("${url}");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            opacity: ${opacity};
            transition: opacity 1s;
            mix-blend-mode: screen;
        }
    `;
	}

	async function showThumb() {
		const stored = await chrome.storage.local.get([THUMB_KEY, OPACITY_KEY, ENABLED_KEY]);
		if (stored[ENABLED_KEY] === false) return;

		const thumbUrl = stored[THUMB_KEY];
		const opacity = stored[OPACITY_KEY] ?? 0.2;
		if (thumbUrl && !objectUrl) {
			mount(thumbUrl, opacity);
		}
	}

	async function showFullRes() {
		const myRun = ++runId;

		const stored = await chrome.storage.local.get([
			HOST_KEY,
			PAGE_KEY,
			ENABLED_KEY,
			OPACITY_KEY,
		]);

		const enabled = stored[ENABLED_KEY] ?? true;
		const opacity = stored[OPACITY_KEY] ?? 0.2;

		if (!enabled) return clear();

		const id = stored[PAGE_KEY] ?? stored[HOST_KEY];
		if (id == null) return clear();

		let res;
		try {
			res = await chrome.runtime.sendMessage({ type: MSG_GET_IMAGE, id });
		} catch {
			return; // extension không sẵn sàng
		}

		if (myRun !== runId) return;
		if (!res?.ok) return clear();

		const url = URL.createObjectURL(res.blob);
		clear(); // xóa styleElement cũ, revoke object url cũ
		objectUrl = url;
		mount(url, opacity);
	}

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === "local") {
			if (
				changes[HOST_KEY] ||
				changes[PAGE_KEY] ||
				changes[ENABLED_KEY] ||
				changes[OPACITY_KEY]
			) {
				showFullRes();
			}
		}
	});

	showThumb(); // Zero round-trip latency
	showFullRes(); // Swap to full-res
})();
