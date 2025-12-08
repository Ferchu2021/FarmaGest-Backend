/**
 * Script para cambiar contraseñas de usuarios
 * Uso: node scripts/cambiar-contrasenas-usuarios.js
 */
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const readline = require("readline");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "farma_gest",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listarUsuarios() {
  try {
    const result = await pool.query(
      `SELECT u.usuario_id, u.nombre, u.apellido, u.correo, r.rol 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.rol_id 
       WHERE u.deleted_at IS NULL 
       ORDER BY u.usuario_id`
    );

    console.log("\n📋 Usuarios en la base de datos:\n");
    if (result.rows.length === 0) {
      console.log("   No hay usuarios registrados.\n");
      return [];
    }

    result.rows.forEach((usuario, index) => {
      console.log(
        `   ${index + 1}. ID: ${usuario.usuario_id} | ${usuario.nombre} ${usuario.apellido} | ${usuario.correo} | Rol: ${usuario.rol || "Sin rol"}`
      );
    });
    console.log();
    return result.rows;
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error.message);
    return [];
  }
}

async function cambiarContrasena(usuarioId, nuevaContrasena) {
  try {
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    const result = await pool.query(
      `UPDATE usuarios 
       SET contrasena = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE usuario_id = $2 AND deleted_at IS NULL`,
      [hashedPassword, usuarioId]
    );

    if (result.rowCount > 0) {
      return { success: true, message: "Contraseña actualizada exitosamente" };
    } else {
      return { success: false, message: "Usuario no encontrado" };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function cambiarTodasLasContrasenas(nuevaContrasena) {
  try {
    const usuarios = await pool.query(
      `SELECT usuario_id, nombre, apellido, correo 
       FROM usuarios 
       WHERE deleted_at IS NULL`
    );

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    let actualizados = 0;

    for (const usuario of usuarios.rows) {
      await pool.query(
        `UPDATE usuarios 
         SET contrasena = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE usuario_id = $2`,
        [hashedPassword, usuario.usuario_id]
      );
      actualizados++;
      console.log(
        `   ✅ ${usuario.nombre} ${usuario.apellido} (${usuario.correo})`
      );
    }

    return {
      success: true,
      message: `Se actualizaron ${actualizados} contraseña(s)`,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function main() {
  console.log("🔐 Script para cambiar contraseñas de usuarios\n");

  try {
    // Listar usuarios
    const usuarios = await listarUsuarios();

    if (usuarios.length === 0) {
      console.log("No hay usuarios para modificar.");
      rl.close();
      await pool.end();
      return;
    }

    // Preguntar qué hacer
    console.log("Opciones:");
    console.log("  1. Cambiar contraseña de un usuario específico");
    console.log("  2. Cambiar todas las contraseñas a la misma");
    console.log("  3. Restablecer contraseña del administrador a 'admin123'");
    console.log("  4. Salir\n");

    const opcion = await question("Selecciona una opción (1-4): ");

    if (opcion === "4") {
      console.log("👋 Saliendo...");
      rl.close();
      await pool.end();
      return;
    }

    if (opcion === "1") {
      // Cambiar contraseña de un usuario específico
      const usuarioIndex = await question(
        `\nIngresa el número del usuario (1-${usuarios.length}): `
      );
      const usuario = usuarios[parseInt(usuarioIndex) - 1];

      if (!usuario) {
        console.log("❌ Usuario no válido");
        rl.close();
        await pool.end();
        return;
      }

      const nuevaContrasena = await question(
        `\nNueva contraseña para ${usuario.nombre} ${usuario.apellido} (${usuario.correo}): `
      );

      if (!nuevaContrasena || nuevaContrasena.trim() === "") {
        console.log("❌ La contraseña no puede estar vacía");
        rl.close();
        await pool.end();
        return;
      }

      console.log("\n⏳ Actualizando contraseña...");
      const resultado = await cambiarContrasena(
        usuario.usuario_id,
        nuevaContrasena.trim()
      );

      if (resultado.success) {
        console.log(`✅ ${resultado.message}`);
        console.log(`   Usuario: ${usuario.correo}`);
        console.log(`   Nueva contraseña: ${nuevaContrasena.trim()}`);
      } else {
        console.log(`❌ ${resultado.message}`);
      }
    } else if (opcion === "2") {
      // Cambiar todas las contraseñas
      const nuevaContrasena = await question(
        "\nNueva contraseña para todos los usuarios: "
      );

      if (!nuevaContrasena || nuevaContrasena.trim() === "") {
        console.log("❌ La contraseña no puede estar vacía");
        rl.close();
        await pool.end();
        return;
      }

      const confirmar = await question(
        `\n⚠️  ¿Estás seguro de cambiar TODAS las contraseñas a "${nuevaContrasena.trim()}"? (s/n): `
      );

      if (confirmar.toLowerCase() !== "s" && confirmar.toLowerCase() !== "si") {
        console.log("❌ Operación cancelada");
        rl.close();
        await pool.end();
        return;
      }

      console.log("\n⏳ Actualizando contraseñas...");
      const resultado = await cambiarTodasLasContrasenas(
        nuevaContrasena.trim()
      );

      if (resultado.success) {
        console.log(`\n✅ ${resultado.message}`);
        console.log(`   Nueva contraseña para todos: ${nuevaContrasena.trim()}`);
      } else {
        console.log(`\n❌ ${resultado.message}`);
      }
    } else if (opcion === "3") {
      // Restablecer contraseña del administrador
      const adminUsuario = usuarios.find((u) =>
        u.correo.toLowerCase().includes("admin")
      );

      if (!adminUsuario) {
        console.log(
          "\n❌ No se encontró un usuario administrador (busca correos con 'admin')"
        );
      } else {
        const nuevaContrasena = process.env.ADMIN_PASSWORD || "admin123";
        console.log(
          `\n⏳ Restableciendo contraseña del administrador a '${nuevaContrasena}'...`
        );

        const resultado = await cambiarContrasena(
          adminUsuario.usuario_id,
          nuevaContrasena
        );

        if (resultado.success) {
          console.log(`✅ ${resultado.message}`);
          console.log(`   Usuario: ${adminUsuario.correo}`);
          console.log(`   Nueva contraseña: ${nuevaContrasena}`);
        } else {
          console.log(`❌ ${resultado.message}`);
        }
      }
    } else {
      console.log("❌ Opción no válida");
    }

    console.log();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();




