// reportesStrategies.js
const db = require("../db");

// Clase abstracta para la estrategia de reportes. Define un método execute que deben implementar todas las estrategias concretas.
class ReporteStrategy {
  execute(req, callback) {
    throw new Error("You must implement this method");
  }
}

// Estrategia concreta para obtener reportes de ventas por fecha.
class VentasPorFechaStrategy extends ReporteStrategy {
  execute(req, callback) {
    // Extrae las fechas de inicio y fin desde la consulta, que son usadas para filtrar las ventas en la base de datos.
    const { dateSelectedFrom, dateSelectedTo } = req.query;
    let queryVentasPorFecha;
    const params = [];

    // Prepara la consulta SQL basada en si se proporcionó una fecha de fin.
    if (dateSelectedFrom && dateSelectedTo) {
      // Si se proporciona la fecha de fin, selecciona ventas entre las fechas de inicio y fin.
      queryVentasPorFecha = `
                SELECT v.fecha_hora::date AS fecha, COUNT(*) AS cantidad_ventas, SUM(v.total) AS monto_total
                FROM ventas v
                WHERE v.fecha_hora::date BETWEEN $1::date AND $2::date
                GROUP BY v.fecha_hora::date
                ORDER BY fecha DESC;
            `;
      params.push(dateSelectedFrom, dateSelectedTo);
    } else if (dateSelectedFrom) {
      // Si no se proporciona la fecha de fin, selecciona ventas desde la fecha de inicio hasta la fecha actual.
      queryVentasPorFecha = `
                SELECT v.fecha_hora::date AS fecha, COUNT(*) AS cantidad_ventas, SUM(v.total) AS monto_total
                FROM ventas v
                WHERE v.fecha_hora::date >= $1::date
                GROUP BY v.fecha_hora::date
                ORDER BY fecha DESC;
            `;
      params.push(dateSelectedFrom);
    } else if (dateSelectedTo) {
      // Si no se proporciona la fecha de fin, selecciona ventas desde la fecha de inicio hasta la fecha actual.
      queryVentasPorFecha = `
                SELECT v.fecha_hora::date AS fecha, COUNT(*) AS cantidad_ventas, SUM(v.total) AS monto_total
                FROM ventas v
                WHERE v.fecha_hora::date <= $1::date
                GROUP BY v.fecha_hora::date
                ORDER BY fecha DESC;
            `;
      params.push(dateSelectedTo);
    } else {
      queryVentasPorFecha = `
                SELECT v.fecha_hora::date AS fecha, COUNT(*) AS cantidad_ventas, SUM(v.total) AS monto_total
                FROM ventas v
                GROUP BY v.fecha_hora::date
                ORDER BY fecha DESC 
                LIMIT 10;
            `;
    }

    // Ejecuta la consulta en la base de datos y maneja el resultado o el error.
    db.query(queryVentasPorFecha, params, (err, resultados) => {
      if (err) {
        console.error("Error en consulta de reportes:", err);
        return callback(err);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = resultados.rows || resultados;
      callback(null, Array.isArray(rows) ? rows : []);
    });
  }
}

// Exporta la estrategia para que pueda ser utilizada por otras partes del sistema.
module.exports = { VentasPorFechaStrategy };
