(() => {
	// Guard: tránh chạy lại khi executeScript inject lần 2
	if (window.__bgcInitialized) return;
	window.__bgcInitialized = true;

	const MSG_GET_IMAGE = "IMAGE_GET";
	const HOST_KEY = `hostImage:${location.hostname}`;
	const PAGE_KEY = `pageImage:${location.hostname}:${location.pathname}`;
	const ENABLED_KEY = `hostEnabled:${location.hostname}`;
	const OPACITY_KEY = `hostOpacity:${location.hostname}`;
	const THUMB_KEY = `hostThumb:${location.hostname}`;

	let objectUrl = null;
	let runId = 0;
	let styleElement = null;

	// ── Overlay management ───────────────────────────────────────────────────

	function unmount() {
		if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
		if (styleElement) { styleElement.remove(); styleElement = null; }
		document.documentElement.style.removeProperty("--bgc-url");
		document.documentElement.style.removeProperty("--bgc-opacity");
	}

	function ensureStyle() {
		if (styleElement) return;
		styleElement = document.createElement("style");
		styleElement.innerHTML = `
			:root { --bgc-url: url(""); --bgc-opacity: 0.2; }
			body::after {
				content: ""; display: block; position: fixed; inset: 0;
				z-index: 2147483647; pointer-events: none;
				background-image: var(--bgc-url);
				background-size: cover; background-repeat: no-repeat; background-position: center;
				opacity: var(--bgc-opacity);
				transition: opacity 0.3s ease-out;
				mix-blend-mode: screen;
			}
		`;
		(document.head || document.documentElement).appendChild(styleElement);
	}

	function setUrl(url) {
		ensureStyle();
		document.documentElement.style.setProperty("--bgc-url", `url("${url}")`);
	}

	function setOpacity(opacity) {
		ensureStyle();
		document.documentElement.style.setProperty("--bgc-opacity", opacity);
	}

	// ── Init: load on page start ─────────────────────────────────────────────

	async function init() {
		const stored = await chrome.storage.local.get([
			HOST_KEY, PAGE_KEY, ENABLED_KEY, OPACITY_KEY, THUMB_KEY,
		]);

		const enabled = stored[ENABLED_KEY] ?? true;
		if (!enabled) return;

		const opacity = stored[OPACITY_KEY] ?? 0.2;
		const imageId = stored[PAGE_KEY] ?? stored[HOST_KEY];
		if (imageId == null) return;

		// Fast path: show thumbnail instantly while fetching full-res
		const thumb = stored[THUMB_KEY];
		if (thumb) {
			setUrl(thumb);
			setOpacity(opacity);
		}

		// Full-res from IndexedDB
		const myRun = ++runId;
		let res;
		try { res = await chrome.runtime.sendMessage({ type: MSG_GET_IMAGE, id: imageId }); }
		catch { return; }

		if (myRun !== runId || !res?.ok) return;

		const url = URL.createObjectURL(res.blob);
		if (objectUrl) URL.revokeObjectURL(objectUrl);
		objectUrl = url;
		setUrl(url);
		setOpacity(opacity);
	}

	// ── Storage change listener ──────────────────────────────────────────────

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area !== "local") return;

		const imgChanged = changes[HOST_KEY] || changes[PAGE_KEY];
		const enabledChanged = changes[ENABLED_KEY];
		const opacityChanged = changes[OPACITY_KEY];

		if (imgChanged || enabledChanged) {
			// Re-run full init to handle image switch / toggle off
			const newEnabled = enabledChanged
				? enabledChanged.newValue
				: (document.documentElement.style.getPropertyValue("--bgc-opacity") !== "");

			if (enabledChanged && !enabledChanged.newValue) {
				unmount();
				return;
			}

			// New imageId: fetch full-res (thumbnail comes separately via THUMB_KEY change)
			const myRun = ++runId;
			const imageIdEntry = (changes[HOST_KEY] || changes[PAGE_KEY]);
			const newImageId = imageIdEntry?.newValue ?? null;

			if (newImageId == null) { unmount(); return; }

			const opacity = opacityChanged?.newValue
				?? (parseFloat(document.documentElement.style.getPropertyValue("--bgc-opacity")) || 0.2);

			chrome.runtime.sendMessage({ type: MSG_GET_IMAGE, id: newImageId })
				.then((res) => {
					if (myRun !== runId || !res?.ok) return;
					const url = URL.createObjectURL(res.blob);
					if (objectUrl) URL.revokeObjectURL(objectUrl);
					objectUrl = url;
					setUrl(url);
					setOpacity(opacity);
				})
				.catch(() => {});

		} else if (opacityChanged) {
			// Only opacity changed: update CSS var directly (smooth transition)
			setOpacity(opacityChanged.newValue ?? 0.2);

		} else if (changes[THUMB_KEY]?.newValue && !objectUrl) {
			// Thumbnail arrived but no full-res yet (edge case on initial apply)
			const opacity = opacityChanged?.newValue ?? 0.2;
			setUrl(changes[THUMB_KEY].newValue);
			setOpacity(opacity);
		}
	});

	init();
})();
