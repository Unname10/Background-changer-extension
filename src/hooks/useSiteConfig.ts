import { useState, useEffect } from "react";
import { MSG, hostKey, pageKey, enabledKey, opacityKey, DEFAULT_OPACITY } from "../lib/constants";

export function useSiteConfig(hostname: string, pathname: string) {
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
		});
		if (scope === "website") setHostImageId(imageId);
		else setPageImageId(imageId);
	};

	const toggleSite = async (newEnabled: boolean) => {
		await chrome.runtime.sendMessage({
			type: MSG.TOGGLE_SITE,
			hostname,
			enabled: newEnabled,
		});
		setEnabled(newEnabled);
	};

	const updateOpacity = async (newOpacity: number) => {
		setOpacity(newOpacity);
		// Update without changing image
		await chrome.runtime.sendMessage({
			type: MSG.APPLY_IMAGE,
			hostname,
			pathname,
			scope: "website", // Scope only matters for imageId, but we can just pass current imageId if we wanted, but we might overwrite.
			// Actually, APPLY_IMAGE modifies both if we pass imageId. Let's just update storage directly for opacity to be safe
		});
		// To avoid issues with apply_image overwriting things, we can just use chrome.storage.local for opacity.
		// Wait, APPLY_IMAGE takes imageId. If undefined, it might set it to null. 
		// Let's just set storage directly for opacity.
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
