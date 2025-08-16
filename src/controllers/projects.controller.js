import { Op } from "sequelize";
import {
  Project,
  ProjectI18n,
  Tag,
  Technology,
  ProjectLink,
  ProjectAsset,
} from "../models/index.js";
import { pickI18n } from "../utils/helpers.js";

export const listProjects = async (req, res) => {
  try {
    const locale = req.query.locale || "id";
    const status = req.query.status || "published";
    const tag = req.query.tag;
    const tech = req.query.tech;
    const search = (req.query.search || "").toLowerCase();

    const include = [
      { model: ProjectI18n, as: "i18n" },
      { model: ProjectLink, as: "links" },
      { model: Tag, as: "tags", through: { attributes: [] } },
      { model: Technology, as: "technologies", through: { attributes: [] } },
    ];
    let where = {};
    if (status) where.status = status;

    let projects = await Project.findAll({
      where,
      include,
      order: [
        ["is_featured", "DESC"],
        ["order_index", "ASC"],
      ],
    });

    // Filter by tag/tech
    if (tag)
      projects = projects.filter((p) => p.tags.some((t) => t.slug === tag));
    if (tech)
      projects = projects.filter((p) =>
        p.technologies.some((t) => t.slug === tech)
      );

    // Map output & search
    const out = projects
      .map((p) => {
        const i = pickI18n(p.i18n, locale);
        return {
          id: p.id,
          status: p.status,
          is_featured: p.is_featured,
          order_index: p.order_index,
          start_date: p.start_date,
          end_date: p.end_date,
          is_ongoing: p.is_ongoing,
          cover_asset_id: p.cover_asset_id,
          title: i?.title || null,
          slug: i?.slug || null,
          subtitle: i?.subtitle || null,
          summary: i?.summary || null,
          tags: p.tags.map((t) => t.slug),
          techs: p.technologies.map((t) => t.slug),
          links: p.links.map((l) => ({
            id: l.id,
            kind: l.kind,
            label: l.label,
            url: l.url,
            is_primary: l.is_primary,
          })),
        };
      })
      .filter((item) => {
        if (!search) return true;
        const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
        return text.includes(search);
      });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
};

export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const locale = req.query.locale || "id";

    const p = await Project.findByPk(id, {
      include: [
        { model: ProjectI18n, as: "i18n" },
        { model: ProjectLink, as: "links" },
        { model: Tag, as: "tags", through: { attributes: [] } },
        { model: Technology, as: "technologies", through: { attributes: [] } },
      ],
    });
    if (!p) return res.status(404).json({ error: "Project not found" });

    const i = pickI18n(p.i18n, locale);
    res.json({
      id: p.id,
      status: p.status,
      is_featured: p.is_featured,
      order_index: p.order_index,
      start_date: p.start_date,
      end_date: p.end_date,
      is_ongoing: p.is_ongoing,
      cover_asset_id: p.cover_asset_id,
      title: i?.title || null,
      slug: i?.slug || null,
      subtitle: i?.subtitle || null,
      summary: i?.summary || null,
      tags: p.tags.map((t) => t.slug),
      techs: p.technologies.map((t) => t.slug),
      links: p.links.map((l) => ({
        id: l.id,
        kind: l.kind,
        label: l.label,
        url: l.url,
        is_primary: l.is_primary,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
};

export const createProject = async (req, res) => {
  const t = await Project.sequelize.transaction();
  try {
    const payload = req.body;

    const clientId = payload.client_name
      ? await (
          await import("./shared.controller.js")
        ).getOrCreateClient(payload.client_name, t)
      : null;

    const p = await Project.create(
      {
        status: payload.status || "draft",
        is_featured: !!payload.is_featured,
        order_index: payload.order_index || 0,
        client_id: clientId,
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
        is_ongoing: !!payload.is_ongoing,
        extra: payload.extra || {},
      },
      { transaction: t }
    );

    // i18n
    for (const i of payload.i18n || []) {
      await ProjectI18n.create(
        {
          project_id: p.id,
          locale: i.locale,
          title: i.title,
          slug: i.slug,
          subtitle: i.subtitle || null,
          summary: i.summary || null,
          body: i.body || [],
          seo: i.seo || {},
        },
        { transaction: t }
      );
    }
    // links
    for (const l of payload.links || []) {
      await ProjectLink.create(
        {
          project_id: p.id,
          kind: l.kind,
          label: l.label,
          url: l.url,
          is_primary: !!l.is_primary,
        },
        { transaction: t }
      );
    }

    // tags
    if (payload.tags_slugs?.length) {
      const { getOrCreateTag } = await import("./shared.controller.js");
      for (const slug of payload.tags_slugs) {
        const tag = await getOrCreateTag(slug, null, "tag", t);
        await p.addTag(tag, { transaction: t });
      }
    }

    // techs
    if (payload.tech_slugs?.length) {
      const { getOrCreateTech } = await import("./shared.controller.js");
      for (const slug of payload.tech_slugs) {
        const tech = await getOrCreateTech(slug, null, "tool", t);
        await p.addTechnology(tech, { transaction: t });
      }
    }

    await t.commit();

    // return using getProject shape
    req.params.id = p.id;
    return getProject(req, res);
  } catch (err) {
    console.error(err);
    await t.rollback();
    res
      .status(400)
      .json({ error: "Cannot create project", detail: err.message });
  }
};

export const attachAsset = async (req, res) => {
  const t = await Project.sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      asset_id,
      role = "gallery",
      position = 0,
      caption_i18n = {},
    } = req.body;
    const {
      Project: P,
      Asset: A,
      ProjectAsset: PA,
    } = await import("../models/index.js");

    const proj = await P.findByPk(id);
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const asset = await A.findByPk(asset_id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    await PA.create(
      { project_id: id, asset_id, role, position, caption_i18n },
      { transaction: t }
    );
    await t.commit();
    res.status(204).end();
  } catch (err) {
    console.error(err);
    await t.rollback();
    res.status(400).json({ error: "Cannot attach asset", detail: err.message });
  }
};

export const setCover = async (req, res) => {
  try {
    const { id, assetId } = req.params;
    const proj = await Project.findByPk(id);
    if (!proj) return res.status(404).json({ error: "Project not found" });
    const asset = await (
      await import("../models/index.js")
    ).Asset.findByPk(assetId);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    proj.cover_asset_id = asset.id;
    await proj.save();
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Cannot set cover", detail: err.message });
  }
};
