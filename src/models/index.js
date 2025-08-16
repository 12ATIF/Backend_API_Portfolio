import { sequelize, DataTypes, jsonType } from "../config/db.js";

// Enums
export const ProjectStatus = ["draft", "published", "archived"];
export const AssetType = ["image", "video", "embed", "file"];
export const AssetRole = ["cover", "gallery", "video", "doc"];
export const LinkKind = [
  "live",
  "repo",
  "demo",
  "docs",
  "article",
  "design",
  "package",
];
export const TagKind = ["tag", "category"];
export const TechCategory = [
  "language",
  "framework",
  "library",
  "database",
  "cloud",
  "tool",
  "platform",
];

// Konfigurasi default untuk semua model
const withTimestamps = {
  freezeTableName: true,
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
};

// --- DEFINISI MODEL UTAMA ---

export const Client = sequelize.define(
  "clients",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.TEXT, allowNull: false },
    website_url: DataTypes.TEXT,
    logo_asset_id: DataTypes.UUID,
    location: DataTypes.TEXT,
    industry: DataTypes.TEXT,
    contact_email: DataTypes.TEXT,
  },
  withTimestamps
);

export const Project = sequelize.define(
  "projects",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM(...ProjectStatus),
      allowNull: false,
      defaultValue: "draft",
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    client_id: { type: DataTypes.UUID, allowNull: true },
    cover_asset_id: { type: DataTypes.UUID, allowNull: true },
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY },
    is_ongoing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    extra: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  withTimestamps
);

export const ProjectI18n = sequelize.define(
  "project_i18n",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: { type: DataTypes.UUID, allowNull: false },
    locale: { type: DataTypes.STRING(10), allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    slug: { type: DataTypes.TEXT, allowNull: false },
    subtitle: DataTypes.TEXT,
    summary: DataTypes.TEXT,
    body: { type: jsonType, allowNull: false, defaultValue: [] },
    seo: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    ...withTimestamps,
    indexes: [
      {
        unique: true,
        fields: ["project_id", "locale"],
        name: "uq_project_locale",
      },
      { unique: true, fields: ["locale", "slug"], name: "uq_locale_slug" },
    ],
  }
);

export const Asset = sequelize.define(
  "assets",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: { type: DataTypes.ENUM(...AssetType), allowNull: false },
    filename: { type: DataTypes.TEXT }, // Nama file asli
    filepath: { type: DataTypes.TEXT }, // Path penyimpanan
    filesize: DataTypes.INTEGER,
    metadata: { type: jsonType, defaultValue: {} },
  },
  withTimestamps
);

export const Testimonial = sequelize.define(
  "testimonials",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: { type: DataTypes.UUID },
    client_id: { type: DataTypes.UUID },
    collaborator_id: { type: DataTypes.UUID },
    author_name: DataTypes.TEXT,
    author_role: DataTypes.TEXT,
    quote: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
  },
  withTimestamps
);

// --- DEFINISI MODEL YANG HILANG ---

export const Tag = sequelize.define(
  "tags",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    kind: {
      type: DataTypes.ENUM(...TagKind),
      allowNull: false,
      defaultValue: "tag",
    },
  },
  withTimestamps
);

export const Technology = sequelize.define(
  "technologies",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    category: {
      type: DataTypes.ENUM(...TechCategory),
      allowNull: false,
      defaultValue: "tool",
    },
  },
  withTimestamps
);

export const ProjectLink = sequelize.define(
  "project_links",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.ENUM(...LinkKind), allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    label: DataTypes.TEXT,
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  withTimestamps
);

export const ProjectAsset = sequelize.define(
  "project_assets",
  {
    project_id: { type: DataTypes.UUID, primaryKey: true },
    asset_id: { type: DataTypes.UUID, primaryKey: true },
    role: {
      type: DataTypes.ENUM(...AssetRole),
      allowNull: false,
      defaultValue: "gallery",
    },
    position: { type: DataTypes.INTEGER, defaultValue: 0 },
    caption_i18n: { type: jsonType, defaultValue: {} },
  },
  withTimestamps
);

// --- TABEL PENGHUBUNG (JUNCTION TABLES) ---

export const ProjectTag = sequelize.define(
  "project_tags",
  {
    project_id: { type: DataTypes.UUID, primaryKey: true },
    tag_id: { type: DataTypes.UUID, primaryKey: true },
  },
  { ...withTimestamps, tableName: "project_tags" }
);

export const ProjectTechnology = sequelize.define(
  "project_technologies",
  {
    project_id: { type: DataTypes.UUID, primaryKey: true },
    technology_id: { type: DataTypes.UUID, primaryKey: true },
  },
  { ...withTimestamps, tableName: "project_technologies" }
);

// --- ASOSIASI / HUBUNGAN ANTAR TABEL ---

// Project <--> Client
Project.belongsTo(Client, { foreignKey: "client_id" });
Client.hasMany(Project, { foreignKey: "client_id" });

// Project <--> ProjectI18n
Project.hasMany(ProjectI18n, {
  foreignKey: "project_id",
  as: "i18n",
  onDelete: "CASCADE",
});
ProjectI18n.belongsTo(Project, { foreignKey: "project_id" });

// Project <--> Tag (Many-to-Many)
Project.belongsToMany(Tag, {
  through: ProjectTag,
  foreignKey: "project_id",
  otherKey: "tag_id",
  as: "tags",
});
Tag.belongsToMany(Project, {
  through: ProjectTag,
  foreignKey: "tag_id",
  otherKey: "project_id",
  as: "projects",
});

// Project <--> Technology (Many-to-Many)
Project.belongsToMany(Technology, {
  through: ProjectTechnology,
  foreignKey: "project_id",
  otherKey: "technology_id",
  as: "technologies",
});
Technology.belongsToMany(Project, {
  through: ProjectTechnology,
  foreignKey: "technology_id",
  otherKey: "project_id",
  as: "projects",
});

// Project <--> ProjectLink
Project.hasMany(ProjectLink, {
  foreignKey: "project_id",
  as: "links",
  onDelete: "CASCADE",
});
ProjectLink.belongsTo(Project, { foreignKey: "project_id" });

// Project <--> Asset (Many-to-Many via ProjectAsset)
Project.belongsToMany(Asset, {
  through: ProjectAsset,
  foreignKey: "project_id",
  as: "assets",
});
Asset.belongsToMany(Project, {
  through: ProjectAsset,
  foreignKey: "asset_id",
  as: "projects",
});
