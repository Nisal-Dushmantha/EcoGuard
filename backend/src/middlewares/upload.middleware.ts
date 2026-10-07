import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ── Resolve uploads directory ─────────────────────────────────────────────────
// __dirname here = backend/src/middlewares (tsx runs source directly)
// We walk up two levels to reach the backend project root, then /uploads/evidence
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'evidence');

// Ensure directory exists now at module load time
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
console.log('[upload.middleware] UPLOADS_DIR resolved to:', UPLOADS_DIR);

// ── Use memory storage — avoid any disk-storage callback complexity ────────────
// We write the file ourselves in the controller using req.file.buffer.
// This gives complete control and avoids multer diskStorage path issues.
export const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB hard cap — 2.4 MB images are well within this
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    console.log('[upload.middleware] fileFilter — mimetype:', file.mimetype, '| fieldname:', file.fieldname);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${file.mimetype}". Accepted: JPEG, PNG, WebP, HEIC.`));
    }
  },
});

console.log('[upload.middleware] Multer instance created with memoryStorage, 10 MB limit. Field name: "photo".');
