import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';


const DATABASE_URL = process.env.DATABASE_URL;
const isSQLite = !DATABASE_URL;


export const sequelize = new Sequelize(
DATABASE_URL || 'sqlite:portfolio.db',
{
logging: false,
dialectOptions: DATABASE_URL ? {} : {},
}
);


export const jsonType = (DataTypes.JSONB ?? DataTypes.JSON);


export { DataTypes };