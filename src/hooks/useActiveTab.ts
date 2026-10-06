import { useEffect, useState } from "react";

export function useActiveTab() {
	const [tabId, setTabId] = useState<number | undefined>(undefined);
	const [hostname, setHostname] = useState("");
	const [pathname, setPathname] = useState("");
	const [url, setUrl] = useState("");

	useEffect(() => {
		chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
			if (!tab || !tab.url) return;
			setTabId(tab.id);
			try {
				const u = new URL(tab.url);
				if (/^https?:$/.test(u.protocol)) {
					setHostname(u.hostname);
					setPathname(u.pathname);
					setUrl(tab.url);
				}
			} catch {}
		});
	}, []);

	return { tabId, hostname, pathname, url };
}
