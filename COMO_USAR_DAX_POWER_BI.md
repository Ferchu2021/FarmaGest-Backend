# 📝 Cómo Crear Medidas DAX en Power BI

## 🎯 Método 1: Crear Medida desde el Panel de Campos (Recomendado)

### Paso a Paso:

1. **Abre Power BI Desktop** con tu archivo `.pbix` cargado

2. **Ve al Panel de Campos** (lado derecho de la pantalla)
   - Si no lo ves, ve a: **Vista** → **Panel de campos**

3. **Haz clic derecho** sobre la tabla donde quieres crear la medida
   - Por ejemplo: `v_ventas_completas`
   - O cualquier otra vista/tabla

4. **Selecciona "Nueva medida"** (New measure)
   - Aparecerá en la barra de fórmulas en la parte superior

5. **Pega o escribe tu código DAX** en la barra de fórmulas
   - Ejemplo:
   ```DAX
   Total Ventas = SUM(v_ventas_completas[total])
   ```

6. **Presiona Enter** o haz clic en el ✓ (checkmark) para confirmar

7. **¡Listo!** La medida aparecerá en la lista de campos de esa tabla con un icono de calculadora (fx)

---

## 🎯 Método 2: Crear Medida desde la Pestaña "Modelado"

### Paso a Paso:

1. **Selecciona cualquier visualización** en tu página (o crea una nueva)

2. **Ve a la pestaña "Modelado"** en la cinta superior

3. **Haz clic en "Nueva medida"** (New measure)
   - Aparecerá la barra de fórmulas

4. **Pega tu código DAX** y presiona Enter

5. **Renombra la medida** si es necesario (haz clic en el nombre en la barra de fórmulas)

---

## 🎯 Método 3: Usar el Editor de DAX (Avanzado)

### Paso a Paso:

1. **Ve a la pestaña "Modelado"**

2. **Haz clic en "Nueva medida"** o presiona `Alt + Ctrl + M`

3. **En la barra de fórmulas**, verás algo como:
   ```
   Medida = 
   ```
   (Si está en español) o
   ```
   Measure = 
   ```
   (Si está en inglés)

4. **Reemplaza "Medida" o "Measure"** con el nombre que quieras y pega tu código

---

## 📋 Ejemplo Práctico: Crear "Total Ventas"

### Paso 1: Seleccionar la tabla
- En el panel de campos, haz clic derecho sobre `v_ventas_completas`

### Paso 2: Crear nueva medida
- Selecciona "Nueva medida"

### Paso 3: Pegar código
```DAX
Total Ventas = SUM(v_ventas_completas[total])
```

### Paso 4: Confirmar
- Presiona Enter

### Paso 5: Usar la medida
- Ahora puedes arrastrar "Total Ventas" a cualquier visualización

---

## 🔧 Configurar Formato de la Medida

Después de crear la medida:

1. **Selecciona la medida** en el panel de campos (haz clic en ella)

2. **Ve a la pestaña "Modelado"**

3. **En "Formato"**, selecciona:
   - **Moneda** para valores monetarios
   - **Decimal fijo** para números
   - **Porcentaje** para porcentajes
   - Etc.

4. **Configura decimales** si es necesario

---

## 📊 Ubicación de la Barra de Fórmulas

La **barra de fórmulas** aparece:
- **Arriba del lienzo** (área donde están tus gráficos)
- Tiene un icono de **fx** (función) a la izquierda
- Muestra el nombre de la medida y el código DAX

### Si no la ves:

1. **Vista** → **Barra de fórmulas** (Formula bar)
2. O presiona `Ctrl + Shift + O`

---

## 💡 Consejos Importantes

### ✅ Nombres de Medidas:
- No pueden tener espacios (usa guiones bajos o camelCase)
- Ejemplo: `Total_Ventas` o `TotalVentas`

### ✅ Referencias a Tablas:
- Usa el nombre exacto de la tabla/vista
- Ejemplo: `v_ventas_completas[total]` (no `ventas[total]`)

### ✅ Sintaxis:
- Siempre termina con el operador (SUM, AVERAGE, etc.)
- Usa corchetes `[]` para campos
- Usa paréntesis `()` para funciones

### ✅ Verificar Errores:
- Si hay error, aparecerá en **rojo** en la barra de fórmulas
- Pasa el mouse sobre el error para ver detalles

---

## 🎨 Ejemplo Completo: Crear "Total Ventas MTD"

### 1. Clic derecho en `v_ventas_completas` → "Nueva medida"

### 2. En la barra de fórmulas, pega:

```DAX
Total Ventas MTD = 
CALCULATE(
    SUM(v_ventas_completas[total]),
    FILTER(
        ALL(v_ventas_completas),
        YEAR(v_ventas_completas[fecha]) = YEAR(TODAY()) &&
        MONTH(v_ventas_completas[fecha]) = MONTH(TODAY())
    )
)
```

### 3. Presiona Enter

### 4. Configura formato:
- Selecciona la medida
- **Modelado** → **Formato** → **Moneda**
- Decimales: 2

### 5. Usa en una Tarjeta:
- Arrastra "Total Ventas MTD" a una visualización de Tarjeta

---

## 🔍 Ver Todas tus Medidas

Para ver todas las medidas creadas:

1. **Panel de campos** → Busca el icono de calculadora (fx)
2. O filtra por "Medidas" en el panel de campos
3. Las medidas aparecen con el icono **fx** o **∑**

---

## ⚠️ Solución de Problemas

### ❌ "No se puede encontrar el nombre 'X'"
- Verifica que el nombre de la tabla/vista sea correcto
- Verifica que el campo exista en esa tabla

### ❌ "Error de sintaxis"
- Revisa paréntesis, corchetes y comas
- Asegúrate de que todas las funciones estén cerradas

### ❌ La medida no aparece
- Verifica que hayas presionado Enter para confirmar
- Revisa que no haya errores en rojo en la barra de fórmulas

### ❌ La medida muestra "Error"
- Haz clic en la medida en el panel de campos
- Revisa la barra de fórmulas para ver el error específico

---

## 📚 Medidas DAX Listas para Copiar

### Total Ventas
```DAX
Total Ventas = SUM(v_ventas_completas[total])
```

### Promedio de Venta
```DAX
Promedio Venta = AVERAGE(v_ventas_completas[total])
```

### Lotes Vencidos
```DAX
Lotes Vencidos = 
CALCULATE(
    COUNTROWS(v_power_bi_lotes),
    v_power_bi_lotes[nivel_alerta] = "VENCIDO"
)
```

### Pérdida Total
```DAX
Pérdida Total = SUM(v_power_bi_lotes[perdida_vencido])
```

### Valor en Riesgo (30 días)
```DAX
Valor en Riesgo = SUM(v_power_bi_lotes[riesgo_potencial_30dias])
```

---

## 🎯 Atajos de Teclado

- **Crear nueva medida:** `Alt + Ctrl + M`
- **Mostrar/ocultar barra de fórmulas:** `Ctrl + Shift + O`
- **Confirmar medida:** `Enter`
- **Cancelar edición:** `Esc`

---

✨ **¡Con estos pasos podrás crear todas las medidas DAX que necesites!** ✨

