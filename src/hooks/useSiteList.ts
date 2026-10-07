import { useState, useEffect } from "react";
import { MSG, enabledKey, thumbKey } from "../lib/constants";

export type SiteConfig = {
	hostname: string;
	enabled: boolean;
	thumbnailUrl?: string;
	imageName?: string;
};

export function useSiteList(tabId?: number) {
	const [sites, setSites] = useState<SiteConfig[]>([]);

	async function loadSites() {
		const allData = (await chrome.storage.local.get()) as Record<string, any>;
		const hostnames = new Set<string>();

		for (const key of Object.keys(allData)) {
			// hostImage:{hostname}
			if (key.startsWith("hostImage:")) {
				hostnames.add(key.slice("hostImage:".length));
			}
			// pageImage:{hostname}:{pathname} — extract only hostname portion
			if (key.startsWith("pageImage:")) {
				const rest = key.slice("pageImage:".length);
				// hostname is everything up to the first "/" which starts the pathname
				const slashIdx = rest.indexOf("/");
				hostnames.add(slashIdx === -1 ? rest : rest.slice(0, slashIdx));
			}
		}

		const siteConfigs: SiteConfig[] = [];
		for (const hostname of hostnames) {
			const enabled = allData[enabledKey(hostname)] ?? true;
			const thumbnailUrl = allData[thumbKey(hostname)];

			const imageId = allData[`hostImage:${hostname}`];
			let imageName = "Custom Image";
			if (imageId != null) {
				try {
					const res = await chrome.runtime.sendMessage({ type: MSG.GET_IMAGE, id: imageId });
					if (res?.ok) imageName = res.name;
				} catch {}
			}

			siteConfigs.push({ hostname, enabled, thumbnailUrl, imageName });
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
			tabId,
		});
		setSites((prev) => prev.map((s) => s.hostname === hostname ? { ...s, enabled: newEnabled } : s));
	}

	return { sites, toggleSite };
}
