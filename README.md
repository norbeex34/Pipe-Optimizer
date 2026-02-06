# MSH Pipe Optimizer - Vercel Deploy

Sistema de optimización de cortes para caños - Versión Web

## 🚀 Deploy en Vercel (Método Recomendado)

### Opción 1: Deploy desde GitHub (Más Fácil)

1. **Sube el proyecto a GitHub:**
   - Crea un nuevo repositorio en GitHub
   - Sube todos los archivos de esta carpeta

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es Next.js
   - Click en "Deploy"

3. **¡Listo!** Tu app estará disponible en: `https://tu-proyecto.vercel.app`

### Opción 2: Deploy con Vercel CLI

1. **Instala Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login en Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd msh-pipe-vercel
   vercel
   ```

4. Sigue las instrucciones en pantalla

## 💻 Desarrollo Local

Si quieres probar la app localmente antes de deployar:

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Estructura del Proyecto

```
msh-pipe-vercel/
├── app/
│   ├── layout.tsx       # Layout principal
│   ├── page.tsx         # Página principal (la app)
│   └── globals.css      # Estilos globales
├── package.json         # Dependencias
├── next.config.js       # Configuración de Next.js
├── tailwind.config.js   # Configuración de Tailwind
└── tsconfig.json        # Configuración de TypeScript
```

## 🎨 Tecnologías Usadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos (aunque usamos CSS-in-JS personalizado)
- **Lucide React** - Íconos
- **Vercel** - Hosting y deployment

## ⚙️ Configuración

El proyecto está configurado para funcionar sin modificaciones. Vercel detectará automáticamente:

- Framework: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

## 🌐 Variables de Entorno

No se necesitan variables de entorno para este proyecto.

## 📝 Notas Importantes

- **Sin Backend:** La app funciona 100% en el frontend
- **Sin Base de Datos:** Los datos solo existen durante la sesión
- **Exportación:** La función de exportar a PDF funciona localmente en el navegador

## 🐛 Troubleshooting

### Error de Build:
Si Vercel da error al hacer build:
1. Verifica que todos los archivos estén subidos
2. Revisa los logs en el dashboard de Vercel
3. Asegúrate de que `package.json` esté correcto

### La app no carga:
1. Limpia caché del navegador
2. Verifica que el deploy terminó exitosamente
3. Revisa la consola del navegador para errores

## 📞 Soporte

Para problemas con el deployment, consulta:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)

---

**MSH Pipe Optimizer** - Optimiza tus cortes, maximiza tu producción 🚀
