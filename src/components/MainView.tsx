import { useState, useEffect } from "react";
import { Toggle } from "./Toggle";
import { UploadCard } from "./UploadCard";
import { ImageCard } from "./ImageCard";
import { useActiveTab } from "../hooks/useActiveTab";
import { useImageStore } from "../hooks/useImageStore";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { cn } from "../utils/cn";
import { MSG } from "../lib/constants";

export function MainView({ onNavigate }: { onNavigate: () => void }) {
	const { tabId, hostname, pathname } = useActiveTab();
	const { images, uploadFiles, deleteImage, error: storeError } = useImageStore();
	const {
		enabled,
		opacity,
		hostImageId,
		pageImageId,
		loaded,
		applyImage,
		toggleSite,
		updateOpacity,
	} = useSiteConfig(hostname, pathname, tabId);

	const [scope, setScope] = useState<"page" | "website">("website");
	const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string>("");
	const [applyStatus, setApplyStatus] = useState<"idle" | "applying" | "success">("idle");
	const [localOpacity, setLocalOpacity] = useState<number | null>(null);

	const displayOpacity = localOpacity !== null ? localOpacity : opacity;

	// Sync local selection with stored configuration
	useEffect(() => {
		if (loaded) {
			const activeId = scope === "page" ? pageImageId : hostImageId;
			setSelectedImageId(activeId);
		}
	}, [loaded, scope, pageImageId, hostImageId]);

	// Load preview image
	useEffect(() => {
		let active = true;
		if (selectedImageId == null) {
			setPreviewUrl("");
			return;
		}
		chrome.runtime.sendMessage({ type: MSG.GET_IMAGE, id: selectedImageId }).then((res) => {
			if (active && res?.ok) {
				const url = URL.createObjectURL(res.blob);
				setPreviewUrl(url);
			}
		});
		return () => {
			active = false;
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [selectedImageId]);

	if (!hostname) {
		return <div className="p-4 text-center text-gray-500">Vui lòng mở một trang web.</div>;
	}

	const handleApply = async () => {
		setApplyStatus("applying");
		await applyImage(scope, selectedImageId);
		setApplyStatus("success");
		setTimeout(() => setApplyStatus("idle"), 2000);
	};

	const handleReset = async () => {
		setSelectedImageId(null);
		await applyImage(scope, null);
	};

	const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalOpacity(parseFloat(e.target.value));
	};

	const handleOpacityCommit = () => {
		if (localOpacity !== null) {
			updateOpacity(localOpacity);
			setLocalOpacity(null);
		}
	};

	return (
		<div className="flex flex-col bg-white text-gray-900 rounded-xl overflow-hidden min-h-[500px]">
			{/* Header */}
			<div className="flex items-center px-4 py-3">
				<div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-3 overflow-hidden flex-shrink-0">
					{/* Fake favicon fallback, could use chrome://favicon */}
					{hostname.charAt(0).toUpperCase()}
				</div>
				<div className="flex-1 min-w-0">
					<div className="font-semibold text-[15px] truncate">{hostname}</div>
					<div className="text-xs text-gray-500">{enabled ? "Đang bật cho trang này" : "Đã tắt cho trang này"}</div>
				</div>
				<div className="flex items-center gap-3 ml-2">
					<button
						onClick={onNavigate}
						className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
						title="Trang đã chọn"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
					<Toggle checked={enabled} onChange={toggleSite} />
				</div>
			</div>

			<div className="px-4 flex-1 overflow-y-auto pb-4">
				{/* Preview Area */}
				<div className="relative w-full h-32 rounded-xl mb-4 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-100 shadow-sm flex items-center justify-center">
					{previewUrl ? (
						<img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
					) : (
						<span className="text-gray-400 text-sm font-medium">Chưa chọn nền</span>
					)}
					<div className="absolute top-2 left-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold shadow-sm">
						Xem trước
					</div>
				</div>

				{/* Gallery */}
				<div className="grid grid-cols-3 gap-2 mb-2">
					<UploadCard onUpload={uploadFiles} />
					{images.map((img) => (
						<ImageCard
							key={img.id}
							image={img}
							selected={selectedImageId === img.id}
							onSelect={() => setSelectedImageId(img.id)}
							onDelete={() => deleteImage(img.id)}
						/>
					))}
				</div>
				<p className="text-xs text-gray-500 mb-5">Ảnh được lưu trên máy của bạn.</p>
				{storeError && <p className="text-xs text-red-500 mb-2">{storeError}</p>}

				{/* Opacity */}
				<div className="mb-6">
					<div className="flex justify-between text-sm mb-2">
						<span className="font-semibold text-gray-800">Độ mờ</span>
						<span className="text-gray-500">{Math.round(displayOpacity * 100)}%</span>
					</div>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={displayOpacity}
						onChange={handleOpacityChange}
						onMouseUp={handleOpacityCommit}
						onTouchEnd={handleOpacityCommit}
						className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
					/>
				</div>

				{/* Scope */}
				<div className="mb-4">
					<div className="text-sm font-semibold text-gray-800 mb-2">Áp dụng cho</div>
					<div className="flex p-1 bg-gray-100 rounded-lg">
						<button
							className={cn(
								"flex-1 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
								scope === "page" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
							)}
							onClick={() => setScope("page")}
						>
							Trang này
						</button>
						<button
							className={cn(
								"flex-1 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
								scope === "website" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
							)}
							onClick={() => setScope("website")}
						>
							Cả website
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-2">
						{scope === "website"
							? `Mọi trang của ${hostname} sẽ dùng nền này.`
							: `Chỉ áp dụng cho trang ${pathname} hiện tại.`}
					</p>
				</div>
			</div>

			{/* Footer */}
			<div className="p-4 flex gap-3 border-t border-gray-100 bg-white">
				<button
					onClick={handleReset}
					className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
				>
					Đặt lại
				</button>
				<button
					onClick={handleApply}
					disabled={selectedImageId == null || applyStatus === "applying"}
					className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					{applyStatus === "applying" ? "Đang áp dụng..." : applyStatus === "success" ? "Đã áp dụng ✓" : "Áp dụng nền"}
				</button>
			</div>
		</div>
	);
}
