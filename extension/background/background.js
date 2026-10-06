import {
	MSG,
	hostKey,
	pageKey,
	enabledKey,
	opacityKey,
	thumbKey,
	scriptRegIdKey,
	DEFAULT_OPACITY,
} from "../shared/constants.js";
import * as db from "./db.js";

// ── Script registration ──────────────────────────────────────────────────────

async function getOrCreateScriptId(hostname) {
	const key = scriptRegIdKey(hostname);
	const stored = await chrome.storage.local.get(key);
	if (stored[key]) return stored[key];
	const id = crypto.randomUUID();
	await chrome.storage.local.set({ [key]: id });
	return id;
}

async function syncContentScript(hostname, enabled) {
	const id = await getOrCreateScriptId(hostname);
	const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });

	if (!enabled) {
		if (existing.length > 0)
			await chrome.scripting.unregisterContentScripts({ ids: [id] });
		return;
	}

	const descriptor = {
		id,
		matches: [`*://${hostname}/*`],
		js: ["scripts/content.js"],
		css: ["scripts/content.css"],
		runAt: "document_start",
		persistAcrossSessions: true,
	};

	if (existing.length > 0)
		await chrome.scripting.updateContentScripts([descriptor]);
	else
		await chrome.scripting.registerContentScripts([descriptor]);
}

// Inject content script vào tab hiện tại (vì registerContentScripts
// chỉ áp dụng cho tab mở MỚI, không inject vào tab đã mở)
async function injectIntoTab(tabId) {
	if (!tabId) return;
	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			files: ["scripts/content.js"],
		});
	} catch {
		// Tab có thể là chrome:// hoặc không hợp lệ — bỏ qua
	}
}

// ── Thumbnail helper ─────────────────────────────────────────────────────────

async function makeThumb(blob, maxPx = 1280, quality = 0.6) {
	const bitmap = await createImageBitmap(blob);
	const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
	const w = Math.round(bitmap.width * scale);
	const h = Math.round(bitmap.height * scale);
	const canvas = new OffscreenCanvas(w, h);
	canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	const out = await canvas.convertToBlob({ type: "image/jpeg", quality });
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.readAsDataURL(out);
	});
}

// ── Message handlers ─────────────────────────────────────────────────────────

const handlers = {
	[MSG.SAVE_IMAGE]: async ({ name, mime, blob }) => {
		const id = await db.saveImage({ name, type: mime, blob });
		return { id };
	},

	[MSG.LIST_IMAGES]: async () => {
		const rows = await db.listImages();
		return {
			images: rows.map(({ id, name, type, blob, createdAt }) => ({
				id, name, type, size: blob.size, createdAt,
			})),
		};
	},

	[MSG.GET_IMAGE]: async ({ id }) => {
		const record = await db.getImage(id);
		if (!record) throw new Error("Không tìm thấy ảnh");
		return { name: record.name, mime: record.type, blob: record.blob };
	},

	[MSG.DELETE_IMAGE]: async ({ id }) => {
		await db.deleteImage(id);
		return {};
	},

	[MSG.APPLY_IMAGE]: async ({ hostname, pathname, scope, imageId, opacity, enabled, tabId }) => {
		// Bước 1: Lưu imageId + config ngay lập tức
		const updates = {
			[enabledKey(hostname)]: enabled ?? true,
			[opacityKey(hostname)]: opacity ?? DEFAULT_OPACITY,
		};

		if (scope === "website") {
			if (imageId === null) updates[hostKey(hostname)] = null;
			else if (imageId !== undefined) updates[hostKey(hostname)] = imageId;
		} else if (scope === "page") {
			if (imageId === null) updates[pageKey(hostname, pathname)] = null;
			else if (imageId !== undefined) updates[pageKey(hostname, pathname)] = imageId;
		}

		await chrome.storage.local.set(updates);

		// Bước 2: Đăng ký script + inject vào tab hiện tại
		await syncContentScript(hostname, enabled ?? true);
		await injectIntoTab(tabId);

		// Bước 3: Tạo thumbnail (async, không block hiển thị)
		if (imageId != null) {
			const record = await db.getImage(imageId);
			if (record) {
				const thumb = await makeThumb(record.blob, 1280, 0.6);
				await chrome.storage.local.set({ [thumbKey(hostname)]: thumb });
			}
		}

		return { ok: true };
	},

	[MSG.TOGGLE_SITE]: async ({ hostname, enabled, tabId }) => {
		await chrome.storage.local.set({ [enabledKey(hostname)]: enabled });
		await syncContentScript(hostname, enabled);
		await injectIntoTab(tabId);
		return { ok: true };
	},
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (sender.id !== chrome.runtime.id) return false;
	const handler = handlers[message?.type];
	if (!handler) return false;
	handler(message)
		.then((data) => sendResponse({ ok: true, ...data }))
		.catch((err) => sendResponse({ ok: false, error: err.message }));
	return true;
});
