const db = require("../db");

class LiquidacionObrasSociales {
  static obtenerLiquidacion(filtros, callback) {
    const {
      obraSocialId = null,
      fechaDesde = null,
      fechaHasta = null,
      incluirSinObraSocial = false,
    } = filtros;

    // Función para ejecutar la consulta principal
    const ejecutarConsulta = (idsObraSocialParaFiltrar = null) => {
      const params = [];
      let paramIndex = 1;

      // Construir la consulta base
      let whereConditions = [];

      // Filtro por fecha desde
      if (fechaDesde) {
        whereConditions.push(`v.fecha_hora::date >= $${paramIndex}::date`);
        params.push(fechaDesde);
        paramIndex++;
      }

      // Filtro por fecha hasta
      if (fechaHasta) {
        whereConditions.push(`v.fecha_hora::date <= $${paramIndex}::date`);
        params.push(fechaHasta);
        paramIndex++;
      }

      // Filtro por obra social
      if (idsObraSocialParaFiltrar && idsObraSocialParaFiltrar.length > 0) {
        const idsPlaceholders = idsObraSocialParaFiltrar
          .map((_, i) => `$${paramIndex + i}`)
          .join(", ");
        whereConditions.push(`c.obra_social_id IN (${idsPlaceholders})`);
        params.push(...idsObraSocialParaFiltrar);
        paramIndex += idsObraSocialParaFiltrar.length;
      } else if (!incluirSinObraSocial) {
        // Si no se incluyen sin obra social y no hay filtro específico, excluir las que no tienen
        whereConditions.push(`c.obra_social_id IS NOT NULL`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Consulta principal para obtener todas las ventas con detalles
      const queryVentas = `
      SELECT 
        v.venta_id,
        v.fecha_hora,
        v.numero_factura,
        v.total_sin_descuento as subtotal,
        v.descuento,
        v.total,
        c.cliente_id,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.dni as cliente_dni,
        COALESCE(os.obra_social_id, NULL) as obra_social_id,
        COALESCE(os.obra_social, 'Sin obra social') as obra_social,
        COALESCE(os.plan, NULL) as plan,
        COALESCE(os.descuento, 0) as descuento_obra_social
      FROM ventas v
      INNER JOIN clientes c ON v.cliente_id = c.cliente_id
      LEFT JOIN obras_sociales os ON c.obra_social_id = os.obra_social_id
      ${whereClause}
      ORDER BY os.obra_social, v.fecha_hora DESC
    `;

      db.query(queryVentas, params, (err, resultVentas) => {
        if (err) {
          console.error("Error al obtener ventas para liquidación:", err);
          return callback(err, null);
        }

        const ventas = resultVentas.rows || resultVentas;

        // Agrupar ventas por obra social
        const agrupadas = {};
        let totalesGenerales = {
          cantidad_ventas: 0,
          subtotal_total: 0,
          descuento_total: 0,
          aporte_obra_social: 0,
          total_paciente: 0,
        };

        // Función para normalizar nombres de obras sociales
        const normalizarNombreObraSocial = (nombre) => {
          if (!nombre || nombre === "Sin obra social") {
            return "sin-obra-social";
          }
          // Normalizar: quitar espacios extra, convertir a minúsculas, eliminar caracteres especiales
          return nombre
            .trim()
            .replace(/\s+/g, " ") // Reemplazar múltiples espacios con uno solo
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "") // Eliminar caracteres especiales
            .replace(/\s+/g, ""); // Eliminar todos los espacios para unificar "Swiss Medical" y "Swissmedical"
        };

        ventas.forEach((venta) => {
          // Obtener el nombre de la obra social
          const obraSocialNombre = (venta.obra_social || "Sin obra social").trim();
          // Crear clave normalizada para agrupar (sin importar mayúsculas, espacios, caracteres especiales)
          const obraSocialKey = normalizarNombreObraSocial(obraSocialNombre);

          // Si no existe, crear el grupo
          if (!agrupadas[obraSocialKey]) {
            // Usar el nombre original para mostrar, pero normalizado sin espacios múltiples
            const nombreParaMostrar = obraSocialNombre.replace(/\s+/g, " ");

            agrupadas[obraSocialKey] = {
              obra_social_id: venta.obra_social_id, // Mantener el primer ID encontrado
              obra_social: nombreParaMostrar, // Mantener el nombre original (con formato)
              plan: null, // No mostrar plan específico cuando se consolidan múltiples planes
              cantidad_ventas: 0,
              subtotal_total: 0,
              aporte_obra_social: 0,
              total_paciente: 0,
              detalle: [],
            };
          }

          // Calcular descuento porcentual
          const descuentoPorcentaje =
            venta.subtotal > 0
              ? ((venta.descuento / venta.subtotal) * 100).toFixed(2)
              : 0;

          // Calcular aporte de obra social (basado en el descuento de la obra social)
          const descuentoObraSocial = parseFloat(
            venta.descuento_obra_social || 0
          );
          const aporteObraSocial =
            venta.obra_social_id && descuentoObraSocial > 0
              ? (venta.total * descuentoObraSocial) / 100
              : 0;

          // Total que paga el paciente (total - aporte obra social)
          const totalPaciente = venta.total - aporteObraSocial;

          const ventaDetalle = {
            venta_id: venta.venta_id,
            fecha: venta.fecha_hora,
            numero_factura: venta.numero_factura,
            subtotal: parseFloat(venta.subtotal || 0),
            descuento_porcentaje: parseFloat(descuentoPorcentaje),
            aporte_obra_social: parseFloat(aporteObraSocial.toFixed(2)),
            total_paciente: parseFloat(totalPaciente.toFixed(2)),
            cliente: {
              nombre: venta.cliente_nombre,
              apellido: venta.cliente_apellido,
              dni: venta.cliente_dni,
            },
          };

          agrupadas[obraSocialKey].detalle.push(ventaDetalle);
          agrupadas[obraSocialKey].cantidad_ventas += 1;
          agrupadas[obraSocialKey].subtotal_total += parseFloat(
            venta.subtotal || 0
          );
          agrupadas[obraSocialKey].aporte_obra_social += parseFloat(
            aporteObraSocial.toFixed(2)
          );
          agrupadas[obraSocialKey].total_paciente += parseFloat(
            totalPaciente.toFixed(2)
          );

          // Actualizar totales generales
          totalesGenerales.cantidad_ventas += 1;
          totalesGenerales.subtotal_total += parseFloat(venta.subtotal || 0);
          totalesGenerales.descuento_total += parseFloat(venta.descuento || 0);
          totalesGenerales.aporte_obra_social += parseFloat(
            aporteObraSocial.toFixed(2)
          );
          totalesGenerales.total_paciente += parseFloat(
            totalPaciente.toFixed(2)
          );
        });

        // Convertir objeto agrupado a array
        const resumen = Object.values(agrupadas).map((grupo) => ({
          ...grupo,
          subtotal_total: parseFloat(grupo.subtotal_total.toFixed(2)),
          aporte_obra_social: parseFloat(grupo.aporte_obra_social.toFixed(2)),
          total_paciente: parseFloat(grupo.total_paciente.toFixed(2)),
        }));

        // Redondear totales generales
        totalesGenerales.subtotal_total = parseFloat(
          totalesGenerales.subtotal_total.toFixed(2)
        );
        totalesGenerales.descuento_total = parseFloat(
          totalesGenerales.descuento_total.toFixed(2)
        );
        totalesGenerales.aporte_obra_social = parseFloat(
          totalesGenerales.aporte_obra_social.toFixed(2)
        );
        totalesGenerales.total_paciente = parseFloat(
          totalesGenerales.total_paciente.toFixed(2)
        );

        callback(null, {
          resumen,
          totales: totalesGenerales,
          filtros: {
            obraSocialId: obraSocialId || null,
            fechaDesde: fechaDesde || null,
            fechaHasta: fechaHasta || null,
            incluirSinObraSocial: incluirSinObraSocial || false,
          },
          totalRegistros: ventas.length,
        });
      });
    };

    // Si se proporciona un ID de obra social, buscar todas las obras sociales con el mismo nombre
    if (obraSocialId) {
      // Primero obtener el nombre de la obra social seleccionada
      db.query(
        `SELECT obra_social FROM obras_sociales WHERE obra_social_id = $1 AND deleted_at IS NULL`,
        [obraSocialId],
        (err, resultNombre) => {
          if (err) {
            console.error("Error al obtener nombre de obra social:", err);
            return callback(err, null);
          }

          const nombreObraSocial = resultNombre.rows?.[0]?.obra_social;

          if (nombreObraSocial) {
            // Buscar todos los IDs de obras sociales con el mismo nombre
            db.query(
              `SELECT obra_social_id FROM obras_sociales WHERE obra_social = $1 AND deleted_at IS NULL`,
              [nombreObraSocial],
              (err, resultIds) => {
                if (err) {
                  console.error("Error al obtener IDs de obra social:", err);
                  return callback(err, null);
                }

                const idsObraSocial = (resultIds.rows || resultIds).map(
                  (r) => r.obra_social_id
                );

                // Ejecutar la consulta con todos los IDs encontrados
                ejecutarConsulta(idsObraSocial);
              }
            );
          } else {
            // Si no se encuentra la obra social, ejecutar sin filtro de obra social
            ejecutarConsulta(null);
          }
        }
      );
    } else {
      // Si no hay filtro de obra social, ejecutar directamente
      ejecutarConsulta(null);
    }
  }
}

module.exports = LiquidacionObrasSociales;
