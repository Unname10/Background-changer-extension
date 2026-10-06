import { useRef } from "react";

export function UploadCard({ onUpload }: { onUpload: (files: File[]) => void }) {
	const fileRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onUpload(Array.from(e.target.files));
			e.target.value = ""; // Reset
		}
	};

	return (
		<div
			onClick={() => fileRef.current?.click()}
			className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors aspect-[4/3]"
		>
			<span className="text-2xl text-blue-500 mb-1">+</span>
			<span className="text-xs text-blue-600 font-medium">Tải ảnh lên</span>
			<input
				type="file"
				ref={fileRef}
				accept="image/*"
				multiple
				className="hidden"
				onChange={handleChange}
			/>
		</div>
	);
}
