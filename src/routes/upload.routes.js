import { Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "../lib/supabase.js";
import { Asset } from "../models/index.js"; // Sequelize model assets

const upload = multer({ storage: multer.memoryStorage() });
const r = Router();

r.post("/image", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file" });

    const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
    const path = `uploads/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    // 1) Upload ke Storage (bucket: assets)
    const { error: upErr } = await supabaseAdmin.storage
      .from("assets")
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (upErr) throw upErr;

    // 2) Ambil public URL
    const { data } = supabaseAdmin.storage.from("assets").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    // 3) Simpan ke tabel assets (Sequelize) – type image, provider 'supabase'
    const created = await Asset.create({
      type: "image",
      url: publicUrl,
      provider: "supabase",
      metadata: {
        bucket: "assets",
        path,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    res.status(201).json({ ok: true, asset: created });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "Upload failed", detail: String(e?.message || e) });
  }
});

export default r;
