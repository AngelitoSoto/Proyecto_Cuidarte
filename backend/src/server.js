const app = require('./app');
const config = require('./config/config');
const { initDb } = require('./config/database');

async function startServer() {
  try {
    await initDb();
    app.listen(config.PORT, () => {
      console.log(`=================================================`);
      console.log(` Servidor Cuidarte+ escuchando en puerto ${config.PORT}`);
      console.log(` Entorno: ${config.NODE_ENV}`);
      console.log(` Documentación Swagger: http://localhost:${config.PORT}/api-docs`);
      console.log(` Healthcheck: http://localhost:${config.PORT}/api/health`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
