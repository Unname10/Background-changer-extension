import { useState, useEffect } from "react";
import { MSG, MAX_IMAGE_BYTES } from "../lib/constants";

export type ImageRecord = {
	id: number;
	name: string;
	type: string;
	size: number;
	createdAt: number;
};

export function useImageStore() {
	const [images, setImages] = useState<ImageRecord[]>([]);
	const [error, setError] = useState("");

	async function fetchImages() {
		const res = await chrome.runtime.sendMessage({ type: MSG.LIST_IMAGES });
		if (res?.ok) setImages(res.images as ImageRecord[]);
		else setError(res?.error || "Không tải được danh sách ảnh.");
	}

	useEffect(() => {
		fetchImages();
	}, []);

	async function uploadFiles(files: File[]) {
		setError("");
		let saved = 0;
		for (const file of files) {
			if (!file.type.startsWith("image/")) {
				setError(`${file.name}: không phải ảnh.`);
				continue;
			}
			if (file.size > MAX_IMAGE_BYTES) {
				setError(`${file.name}: vượt quá 30MB.`);
				continue;
			}

			// Resize xuống tối đa 1920px trước khi lưu
			const bitmap = await createImageBitmap(file);
			const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
			const w = Math.round(bitmap.width * scale);
			const h = Math.round(bitmap.height * scale);
			const canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h);
			bitmap.close();

			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không tạo được blob"))), "image/png", 0.8);
			});

			const res = await chrome.runtime.sendMessage({
				type: MSG.SAVE_IMAGE,
				name: file.name,
				mime: "image/png",
				blob,
			});

			if (res?.ok) saved++;
			else setError(res?.error ?? `Không lưu được ${file.name}.`);
		}

		if (saved > 0) await fetchImages();
	}

	async function deleteImage(id: number) {
		const res = await chrome.runtime.sendMessage({ type: MSG.DELETE_IMAGE, id });
		if (res?.ok) await fetchImages();
		else setError(res?.error || "Không xoá được ảnh.");
	}

	return { images, error, uploadFiles, deleteImage };
}
