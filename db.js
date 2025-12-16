const { Pool } = require("pg");
require("dotenv").config();

/**
 * Clase Singleton para gestionar la conexión a PostgreSQL
 * Optimizado para FarmaGest con soporte para Power BI e IA
 */
class Database {
  constructor() {
    if (!Database.instance) {
      Database.instance = this;
      
      // Configuración del pool de conexiones
      this.pool = new Pool({
        host: process.env.DB_HOST || process.env.host || "localhost",
        port: process.env.DB_PORT || process.env.port || 5432,
        user: process.env.DB_USER || process.env.user,
        password: process.env.DB_PASSWORD || process.env.password,
        database: process.env.DB_NAME || process.env.database,
        // Opciones de pool
        max: 20, // Máximo de conexiones en el pool
        min: 5, // Mínimo de conexiones en el pool
        idleTimeoutMillis: 30000, // Tiempo de espera antes de cerrar conexiones inactivas
        connectionTimeoutMillis: 2000, // Tiempo de espera para obtener una conexión
        // SSL (opcional, para producción)
        // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Manejo de errores del pool
      this.pool.on("error", (err) => {
        console.error("Unexpected error on idle PostgreSQL client:", err);
        if (err.code === "57P03") {
          console.error("PostgreSQL database is starting up.");
        }
        if (err.code === "57P01") {
          console.error("PostgreSQL database is shutting down.");
        }
        if (err.code === "ECONNREFUSED") {
          console.error("PostgreSQL connection was refused.");
        }
      });

      // Verificar conexión al inicializar
      this.pool.query("SELECT NOW()", (err, res) => {
        if (err) {
          console.error("Error connecting to PostgreSQL database:", err);
        } else {
          console.log("✅ Successful connection pool created for PostgreSQL database");
          console.log("📊 Database ready for Power BI integration");
          console.log("🤖 Database ready for AI/ML integration");
        }
      });
    }
    return Database.instance;
  }

  /**
   * Obtener el pool de conexiones
   * @returns {Pool} Pool de conexiones de PostgreSQL
   */
  getConnection() {
    return this.pool;
  }

  /**
   * Ejecutar una query (compatibilidad con código existente)
   * @param {string} query - Query SQL
   * @param {Array} params - Parámetros de la query
   * @param {Function} callback - Callback (err, result)
   */
  query(query, params, callback) {
    // Si no hay callback, retornar Promise
    if (!callback) {
      return this.pool.query(query, params || []);
    }

    // Convertir parámetros de MySQL (?) a PostgreSQL ($1, $2, ...)
    const convertedQuery = this.convertMySQLToPostgreSQL(query, params);
    
    this.pool.query(convertedQuery.query, convertedQuery.params, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      
      // Convertir resultado a formato compatible con MySQL
      const mysqlFormatResult = {
        ...result,
        insertId: result.rows[0]?.id || result.rows[0]?.producto_id || result.rows[0]?.cliente_id || result.rows[0]?.venta_id || null,
        affectedRows: result.rowCount || 0,
        rows: result.rows
      };
      
      callback(null, mysqlFormatResult);
    });
  }

  /**
   * Convertir query de MySQL a PostgreSQL
   * @param {string} query - Query con placeholders de MySQL (?)
   * @param {Array} params - Parámetros
   * @returns {Object} Query convertida y parámetros
   */
  convertMySQLToPostgreSQL(query, params = []) {
    if (!query || typeof query !== 'string') {
      return { query: query || '', params: params || [] };
    }

    let convertedQuery = query;
    const convertedParams = [];

    // Primero convertir funciones específicas de MySQL ANTES de reemplazar los ?
    convertedQuery = convertedQuery.replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP");
    
    // Convertir DATE() a PostgreSQL
    convertedQuery = convertedQuery.replace(/DATE\(([^)]+)\)/gi, "DATE($1)");

    // Convertir GROUP_CONCAT (MySQL) a STRING_AGG (PostgreSQL)
    // GROUP_CONCAT necesita ser convertido antes de reemplazar los ?
    convertedQuery = convertedQuery.replace(/GROUP_CONCAT\s*\(\s*([^)]+)\s*\)/gi, (match, p1) => {
      // Si tiene SEPARATOR, extraerlo
      const separatorMatch = p1.match(/SEPARATOR\s+['"]([^'"]+)['"]/i);
      const separator = separatorMatch ? separatorMatch[1] : ', ';
      const field = p1.replace(/\s*SEPARATOR\s+['"][^'"]+['"]/i, '').trim();
      return `STRING_AGG(${field}, '${separator}')`;
    });

    // Reemplazar ? con $1, $2, $3, etc. (después de convertir funciones)
    let paramIndex = 1;
    const questionMarkRegex = /\?/g;
    let match;
    const parts = [];
    let lastIndex = 0;
    
    // Resetear el regex para asegurar que funcione correctamente
    questionMarkRegex.lastIndex = 0;
    
    // Procesar manualmente para evitar problemas con callbacks
    while ((match = questionMarkRegex.exec(convertedQuery)) !== null) {
      parts.push(convertedQuery.substring(lastIndex, match.index));
      if (paramIndex - 1 < params.length) {
        convertedParams.push(params[paramIndex - 1]);
      } else {
        // Si no hay suficientes parámetros, agregar undefined
        convertedParams.push(undefined);
      }
      parts.push(`$${paramIndex++}`);
      lastIndex = match.index + 1;
    }
    parts.push(convertedQuery.substring(lastIndex));
    convertedQuery = parts.join('');

    return {
      query: convertedQuery,
      params: convertedParams.length > 0 ? convertedParams : params
    };
  }

  /**
   * Obtener una conexión del pool (para transacciones)
   * @returns {Promise} Promise que resuelve con un cliente de conexión
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Ejecutar una transacción
   * @param {Function} callback - Función que recibe el cliente y ejecuta queries
   * @returns {Promise}
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await callback(client);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

// Crear instancia única
const instance = new Database();

// Exportar métodos compatibles directamente desde la instancia
// Esto evita problemas de recursión
const dbExports = {
  query: function(query, params, callback) {
    // Llamar directamente al método de la instancia sin pasar por exports
    return instance.query.call(instance, query, params, callback);
  },
  getConnection: function() {
    return instance.getConnection();
  },
  getClient: function() {
    return instance.getClient();
  },
  transaction: function(callback) {
    return instance.transaction(callback);
  },
  pool: instance.pool
};

module.exports = dbExports;
