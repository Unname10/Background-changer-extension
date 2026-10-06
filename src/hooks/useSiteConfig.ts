import { useState, useEffect } from "react";
import { MSG, hostKey, pageKey, enabledKey, opacityKey, DEFAULT_OPACITY } from "../lib/constants";

export function useSiteConfig(hostname: string, pathname: string, tabId?: number) {
	const [enabled, setEnabled] = useState(true);
	const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
	const [hostImageId, setHostImageId] = useState<number | null>(null);
	const [pageImageId, setPageImageId] = useState<number | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (!hostname) return;

		const fetchConfig = async () => {
			const hk = hostKey(hostname);
			const pk = pageKey(hostname, pathname);
			const ek = enabledKey(hostname);
			const ok = opacityKey(hostname);

			const stored = await chrome.storage.local.get([hk, pk, ek, ok]);
			setHostImageId(stored[hk] ?? null);
			setPageImageId(stored[pk] ?? null);
			setEnabled(stored[ek] ?? true);
			setOpacity(stored[ok] ?? DEFAULT_OPACITY);
			setLoaded(true);
		};

		fetchConfig();
	}, [hostname, pathname]);

	const applyImage = async (scope: "website" | "page", imageId: number | null) => {
		await chrome.runtime.sendMessage({
			type: MSG.APPLY_IMAGE,
			hostname,
			pathname,
			scope,
			imageId,
			opacity,
			enabled,
			tabId,
		});
		if (scope === "website") setHostImageId(imageId);
		else setPageImageId(imageId);
	};

	const toggleSite = async (newEnabled: boolean) => {
		await chrome.runtime.sendMessage({
			type: MSG.TOGGLE_SITE,
			hostname,
			enabled: newEnabled,
			tabId,
		});
		setEnabled(newEnabled);
	};

	const updateOpacity = async (newOpacity: number) => {
		setOpacity(newOpacity);
		await chrome.storage.local.set({ [opacityKey(hostname)]: newOpacity });
	};

	return {
		enabled,
		opacity,
		hostImageId,
		pageImageId,
		loaded,
		applyImage,
		toggleSite,
		updateOpacity,
	};
}
