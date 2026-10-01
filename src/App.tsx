import { useEffect, useState } from "react";

function App() {
	const [favUrl, setFavUrl] = useState<string>("");

	useEffect(() => {
		chrome.tabs.query({ active: true, currentWindow: true }).then((r) => setFavUrl(r[0].favIconUrl || ""));
	}, []);

	return <h1>Hello {favUrl}</h1>;
}

export default App;
