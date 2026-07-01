import multer from "multer";

const storage = multer.memoryStorage();

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",

    "video/mp4",
    "video/webm",

    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",

    "application/pdf",
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file"));
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter,
});