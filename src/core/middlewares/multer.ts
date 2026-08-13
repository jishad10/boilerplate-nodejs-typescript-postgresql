import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import multer, { StorageEngine, Field, FileFilterCallback } from "multer";
import { Request, RequestHandler } from "express";


// ─── Upload directories ───────────────────────────────────

const uploadDir: string = resolve(process.cwd(), "uploads");
const imageDir: string  = resolve(uploadDir, "images");
const fileDir: string   = resolve(uploadDir, "files");

if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
if (!existsSync(imageDir))  mkdirSync(imageDir,  { recursive: true });
if (!existsSync(fileDir))   mkdirSync(fileDir,   { recursive: true });


// ─── Allowed MIME types ───────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_FILE_TYPES]);


// ─── Storage engine ───────────────────────────────────────

const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(null, imageDir);
    } else {
      cb(null, fileDir);
    }
  },

  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void => {
    const randomName: string      = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeOriginalName: string = file.originalname.replace(/\s+/g, "-");
    cb(null, `${file.fieldname}-${randomName}-${safeOriginalName}`);
  },
});


// ─── MIME-type filter ─────────────────────────────────────
// Rejects files whose MIME type is not in the allowlist before
// they are written to disk. The error surfaces through the global
// error handler as a 400.

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Unsupported file type "${file.mimetype}". ` +
      `Allowed types: JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX.`
    ));
  }
};


// ─── Multer instance ──────────────────────────────────────
// fileSize: 5 MB per file — prevents large upload abuse.
// files:    10 max per request.

const upload: multer.Multer = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files:    10,
  },
});


// ─── Public helper ────────────────────────────────────────

const multerUpload = (fields: Field[]): RequestHandler => {
  return upload.fields(fields);
};


export { upload, multerUpload };