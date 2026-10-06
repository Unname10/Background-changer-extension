import { useState, useEffect } from "react";
import { MSG, MAX_IMAGE_BYTES } from "../lib/constants";

export type ImageRecord = {
	id: number;
	name: string;
	type: string;
	size: number;
	createdAt: number;
	thumbnailUrl?: string; // We'll fetch this lazily or generate it
};

export function useImageStore() {
	const [images, setImages] = useState<ImageRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function fetchImages() {
		try {
			const res = await chrome.runtime.sendMessage({ type: MSG.LIST_IMAGES });
			if (res?.ok) {
				const fetchedImages = res.images as ImageRecord[];
				// We also need thumbnails. We can fetch them lazily or ask background.
				// Since we might have many images, doing it when rendering is better.
				setImages(fetchedImages);
			} else {
				setError(res?.error || "Error fetching images");
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
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
			
			// Compress image to blob before sending
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
				canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/png", 0.8);
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
		if (res?.ok) {
			await fetchImages();
		} else {
			setError(res?.error || "Không xoá được ảnh.");
		}
	}

	return { images, loading, error, uploadFiles, deleteImage };
}
