import { useState, useEffect } from "react";
import { MSG, enabledKey } from "../lib/constants";

export type SiteConfig = {
	hostname: string;
	enabled: boolean;
	thumbnailUrl?: string; // We can load from hostThumb
	imageName?: string;
};

export function useSiteList() {
	const [sites, setSites] = useState<SiteConfig[]>([]);

	async function loadSites() {
		// Use undefined to get all keys (chrome-types compatible)
		const allData = (await chrome.storage.local.get()) as Record<string, any>;
		const hostnames = new Set<string>();

		// Find all hostnames that have a hostImage or pageImage
		for (const key of Object.keys(allData)) {
			if (key.startsWith("hostImage:")) {
				hostnames.add(key.replace("hostImage:", ""));
			} else if (key.startsWith("pageImage:")) {
				const parts = key.split(":");
				if (parts.length >= 3) {
					hostnames.add(parts[1]);
				}
			}
		}

		const siteConfigs: SiteConfig[] = [];
		for (const hostname of hostnames) {
			const enabled = allData[enabledKey(hostname)] ?? true;
			const thumb = allData[`hostThumb:${hostname}`];
			
			// Try to get image name from id
			const imageId = allData[`hostImage:${hostname}`];
			let imageName = "Custom Image"; // default
			if (imageId != null) {
				try {
					const res = await chrome.runtime.sendMessage({ type: MSG.GET_IMAGE, id: imageId });
					if (res?.ok) imageName = res.name;
				} catch {}
			}

			siteConfigs.push({
				hostname,
				enabled,
				thumbnailUrl: thumb,
				imageName,
			});
		}

		setSites(siteConfigs);
	}

	useEffect(() => {
		loadSites();
	}, []);

	async function toggleSite(hostname: string, newEnabled: boolean) {
		await chrome.runtime.sendMessage({
			type: MSG.TOGGLE_SITE,
			hostname,
			enabled: newEnabled,
		});
		setSites(sites.map(s => s.hostname === hostname ? { ...s, enabled: newEnabled } : s));
	}

	return { sites, toggleSite };
}
