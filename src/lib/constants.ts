export const MSG = {
	SAVE_IMAGE: "IMAGE_SAVE",
	LIST_IMAGES: "IMAGE_LIST",
	GET_IMAGE: "IMAGE_GET",
	DELETE_IMAGE: "IMAGE_DELETE",
	APPLY_IMAGE: "IMAGE_APPLY",
	TOGGLE_SITE: "SITE_TOGGLE",
} as const;

export const hostKey = (hostname: string) => `hostImage:${hostname}`;
export const pageKey = (hostname: string, pathname: string) => `pageImage:${hostname}:${pathname}`;
export const enabledKey = (hostname: string) => `hostEnabled:${hostname}`;
export const opacityKey = (hostname: string) => `hostOpacity:${hostname}`;
export const thumbKey = (hostname: string) => `hostThumb:${hostname}`;

export const DEFAULT_OPACITY = 0.2;
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
