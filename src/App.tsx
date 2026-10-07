import { useState } from "react";
import { MainView } from "./components/MainView";
import { SitesView } from "./components/SitesView";
import { useActiveTab } from "./hooks/useActiveTab";

type View = "main" | "sites";

function App() {
	const [view, setView] = useState<View>("main");
	const { tabId } = useActiveTab();

	return (
		<div className="w-full h-full font-sans bg-[#f4f4f5]">
			{view === "main" ? (
				<MainView onNavigate={() => setView("sites")} />
			) : (
				<SitesView onBack={() => setView("main")} tabId={tabId} />
			)}
		</div>
	);
}

export default App;
