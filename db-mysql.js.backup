// db.js
const mysql = require("mysql2");
require("dotenv").config();
class Database {
  constructor() {
    if (!Database.instance) {
      Database.instance = this;
      // Usar createPool en lugar de createConnection para mejor manejo de conexiones concurrentes
      this.pool = mysql.createPool({
        host: process.env.host,
        user: process.env.user,
        password: process.env.password,
        database: process.env.database,
        timezone: "Z",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000, // Tiempo máximo para adquirir conexión (60 segundos)
        timeout: 60000, // Tiempo máximo de inactividad antes de timeout (60 segundos)
        enableKeepAlive: true, // Mantener conexiones vivas
        keepAliveInitialDelay: 0, // Iniciar keep-alive inmediatamente
      });

      // Los pools se conectan automáticamente, pero podemos verificar la conexión
      this.pool.getConnection((err, connection) => {
        if (err) {
          console.error("Error connecting to the database:", err);
        } else {
          console.log("Successful connection pool created for MySQL database");
          connection.release(); // Liberar la conexión de prueba
        }
      });

      // Manejar errores del pool
      this.pool.on("error", (err) => {
        console.error("Unexpected error on idle database connection:", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          console.error("Database connection was closed.");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
          console.error("Database has too many connections.");
        }
        if (err.code === "ECONNREFUSED") {
          console.error("Database connection was refused.");
        }
      });
    }

    return Database.instance; // Retorna siempre la misma instancia
  }

  getConnection() {
    return this.pool; // Método para acceder al pool
  }
}

const instance = new Database(); // Instancia única del Singleton
module.exports = instance.getConnection(); // Exporta el pool
