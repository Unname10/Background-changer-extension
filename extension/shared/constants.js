// Dùng chung cho popup và background (ES module).
// Lưu ý: content script (scripts/content.js) là classic script — các hằng số được khai báo lại trực tiếp.

export const MSG = {
	SAVE_IMAGE: "IMAGE_SAVE",
	LIST_IMAGES: "IMAGE_LIST",
	GET_IMAGE: "IMAGE_GET",
	DELETE_IMAGE: "IMAGE_DELETE",
	APPLY_IMAGE: "IMAGE_APPLY",
	TOGGLE_SITE: "SITE_TOGGLE",
};

// Khoá trong chrome.storage.local
export const hostKey = (hostname) => `hostImage:${hostname}`;
export const pageKey = (hostname, pathname) => `pageImage:${hostname}:${pathname}`;
export const enabledKey = (hostname) => `hostEnabled:${hostname}`;
export const opacityKey = (hostname) => `hostOpacity:${hostname}`;
export const thumbKey = (hostname) => `hostThumb:${hostname}`;
export const scriptRegIdKey = (hostname) => `scriptRegId:${hostname}`;

export const DEFAULT_OPACITY = 0.2; // 20%
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024; // 30MB
