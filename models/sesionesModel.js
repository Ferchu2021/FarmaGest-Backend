const db = require("../db");

class Sesiones {
  constructor(
    correo_usuario,
    navegador,
    ip,
    hora_logueo,
    ultima_actividad,
    hora_logout,
    sesion_id
  ) {
    this.correo_usuario = correo_usuario;
    this.navegador = navegador;
    this.ip = ip;
    this.hora_logueo = hora_logueo;
    this.ultima_actividad = ultima_actividad;
    this.hora_logout = hora_logout;
    this.sesion_id = sesion_id;
  }

  static obtenerSesiones(page = 0, pageSize = 6, search = "", callback) {
    const offset = Math.max(0, (page - 1) * pageSize);
    const hasSearch = search && search.trim() !== "";
    const searchQuery = hasSearch ? `%${search.trim()}%` : "%";
    
    // Construir la query
    let query = `
      SELECT 
        s.sesion_id::text as "sesion_id",
        s.correo_usuario,
        COALESCE(u.nombre || ' ' || u.apellido, s.correo_usuario) as "nombre_completo",
        COALESCE(s.navegador, '') as "navegador",
        COALESCE(s.ip::text, '') as "ip",
        s.hora_logueo,
        s.ultima_actividad,
        s.hora_logout,
        CASE 
          WHEN s.hora_logout IS NULL THEN 'Activa'
          ELSE 'Cerrada'
        END as "estado",
        CASE
          WHEN s.hora_logout IS NOT NULL THEN
            EXTRACT(EPOCH FROM (s.hora_logout - s.hora_logueo)) / 60
          ELSE
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.hora_logueo)) / 60
        END as "duracion_minutos"
      FROM sesiones s
      LEFT JOIN usuarios u ON u.correo = s.correo_usuario
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Agregar condición WHERE para búsqueda
    if (hasSearch) {
      query += ` WHERE (s.correo_usuario ILIKE $${paramIndex} OR COALESCE(s.navegador, '') ILIKE $${paramIndex + 1} OR COALESCE(s.ip::text, '') ILIKE $${paramIndex + 2})`;
      params.push(searchQuery, searchQuery, searchQuery);
      paramIndex += 3;
    }
    
    query += ` ORDER BY s.hora_logueo DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);
    
    return db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error en consulta de sesiones:", err);
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = results?.rows || results || [];
      // Formatear datos para el frontend
      const sesionesFormateadas = Array.isArray(rows) ? rows.map((sesion) => {
        const duracionMinutos = parseFloat(sesion.duracion_minutos || 0);
        let duracionFormateada = "";
        
        if (duracionMinutos >= 60) {
          const horas = Math.floor(duracionMinutos / 60);
          const minutos = Math.floor(duracionMinutos % 60);
          duracionFormateada = `${horas}h ${minutos}m`;
        } else if (duracionMinutos > 0) {
          duracionFormateada = `${Math.floor(duracionMinutos)}m`;
        } else {
          duracionFormateada = "-";
        }
        
        return {
          ...sesion,
          duracion: duracionFormateada,
        };
      }) : [];
      
      callback(null, sesionesFormateadas);
    });
  }
}

module.exports = Sesiones;
