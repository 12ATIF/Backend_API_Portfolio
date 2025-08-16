import { sequelize, DataTypes, jsonType } from '../config/db.js';


// Enums
export const ProjectStatus = ['draft','published','archived'];
export const AssetType = ['image','video','embed','file'];
export const AssetRole = ['cover','gallery','video','doc'];
export const LinkKind = ['live','repo','demo','docs','article','design','package'];
export const TagKind = ['tag','category'];
export const TechCategory = ['language','framework','library','database','cloud','tool','platform'];


const withTimestamps = {
freezeTableName: true,
underscored: true,
timestamps: true,
createdAt: 'created_at',
updatedAt: 'updated_at',
};


export const Client = sequelize.define('clients', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
name: { type: DataTypes.TEXT, allowNull: false },
website_url: DataTypes.TEXT,
logo_asset_id: DataTypes.UUID,
location: DataTypes.TEXT,
industry: DataTypes.TEXT,
contact_email: DataTypes.TEXT,
}, withTimestamps);


export const Project = sequelize.define('projects', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
status: { type: DataTypes.ENUM(...ProjectStatus), allowNull: false, defaultValue: 'draft' },
is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
client_id: { type: DataTypes.UUID, allowNull: true },
cover_asset_id: { type: DataTypes.UUID, allowNull: true },
start_date: { type: DataTypes.DATEONLY },
end_date: { type: DataTypes.DATEONLY },
is_ongoing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
extra: { type: jsonType, allowNull: false, defaultValue: {} },