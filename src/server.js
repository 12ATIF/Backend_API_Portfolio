import app from './app.js';
import { sequelize } from './config/db.js';


const port = process.env.PORT || 8000;


(async () => {
try {
await sequelize.authenticate();
// Sync models (MVP). For production, consider migrations.
await sequelize.sync({ alter: false });
app.listen(port, () => console.log(`API running on http://127.0.0.1:${port}`));
} catch (err) {
console.error('Failed to start:', err);
process.exit(1);
}
})();