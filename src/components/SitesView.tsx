import { useState } from "react";
import { Toggle } from "./Toggle";
import { useSiteList } from "../hooks/useSiteList";

export function SitesView({ onBack, tabId }: { onBack: () => void; tabId?: number }) {
	const { sites, toggleSite } = useSiteList(tabId);
	const [search, setSearch] = useState("");

	const filtered = sites.filter((s) => s.hostname.includes(search.toLowerCase()));

	return (
		<div className="flex flex-col h-full bg-[#f4f4f5] text-gray-900 rounded-xl overflow-hidden min-h-[400px]">
			{/* Header */}
			<div className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
				<button onClick={onBack} className="mr-3 text-gray-600 hover:text-gray-900 cursor-pointer">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<h1 className="font-semibold text-[15px] flex-1">Trang đã chọn</h1>
				<span className="text-gray-400 text-xs">{sites.length} trang</span>
			</div>

			{/* Search */}
			<div className="px-4 py-3 bg-white border-b border-gray-100">
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						type="text"
						className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
						placeholder="Tìm theo tên miền"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto bg-white">
				{filtered.map((site) => (
					<div key={site.hostname} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
						{/* Thumb */}
						<div className="w-12 h-9 rounded bg-gray-100 flex-shrink-0 overflow-hidden mr-3">
							{site.thumbnailUrl && <img src={site.thumbnailUrl} className="w-full h-full object-cover" />}
						</div>
						{/* Info */}
						<div className="flex-1 min-w-0 mr-3">
							<div className="text-sm font-semibold truncate text-gray-800">{site.hostname}</div>
							<div className="text-xs text-gray-500 truncate">Nền: {site.imageName}</div>
						</div>
						{/* Toggle */}
						<Toggle checked={site.enabled} onChange={(c) => toggleSite(site.hostname, c)} />
					</div>
				))}
				{filtered.length === 0 && (
					<div className="text-center py-8 text-gray-400 text-sm">Không tìm thấy trang nào.</div>
				)}
			</div>

			{/* Footer */}
			<div className="p-4 bg-white border-t border-gray-100">
				<button
					onClick={onBack}
					className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
				>
					Về màn hình chính
				</button>
			</div>
		</div>
	);
}
