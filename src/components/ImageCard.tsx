import { useEffect, useState } from "react";
import { MSG } from "../lib/constants";
import type { ImageRecord } from "../hooks/useImageStore";
import { cn } from "../utils/cn";

export function ImageCard({
	image,
	selected,
	onSelect,
	onDelete,
}: {
	image: ImageRecord;
	selected: boolean;
	onSelect: () => void;
	onDelete: () => void;
}) {
	const [blobUrl, setBlobUrl] = useState<string>("");

	useEffect(() => {
		let active = true;
		chrome.runtime.sendMessage({ type: MSG.GET_IMAGE, id: image.id }).then((res) => {
			if (active && res?.ok) {
				const url = URL.createObjectURL(res.blob);
				setBlobUrl(url);
			}
		});

		return () => {
			active = false;
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [image.id]); // only re-run if image.id changes

	return (
		<div
			className={cn(
				"relative rounded-lg overflow-hidden cursor-pointer aspect-[4/3] group border-2",
				selected ? "border-blue-500 shadow-sm" : "border-transparent"
			)}
			onClick={onSelect}
		>
			{blobUrl ? (
				<img src={blobUrl} alt={image.name} className="w-full h-full object-cover" />
			) : (
				<div className="w-full h-full bg-gray-200 animate-pulse"></div>
			)}
			
			{selected && (
				<div className="absolute top-1 right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
					<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
					</svg>
				</div>
			)}

			<button
				className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={(e) => {
					e.stopPropagation();
					if (confirm("Xoá ảnh này khỏi bộ nhớ?")) {
						onDelete();
					}
				}}
				title="Xóa ảnh"
			>
				<span className="text-xs leading-none mb-0.5">×</span>
			</button>
		</div>
	);
}
