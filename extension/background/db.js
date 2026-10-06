// Lớp truy cập IndexedDB (chạy trong service worker)
const DB_NAME = "image-cache-db";
const STORE = "images";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

// Bước 3: lưu Blob vào database, trả về id
export function saveImage({ name, type, blob }) {
  return run("readwrite", (s) =>
    s.add({ name, type, blob, createdAt: Date.now() })
  );
}

// Bước 12-13: lấy lại bản ghi (gồm Blob) theo id
export function getImage(id) {
  return run("readonly", (s) => s.get(id));
}

export function listImages() {
  return run("readonly", (s) => s.getAll());
}

export function deleteImage(id) {
  return run("readwrite", (s) => s.delete(id));
}
