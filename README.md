# PetConnect 🐾

PetConnect es una red social diseñada de dueños para dueños, donde puedes compartir los mejores momentos de tus mascotas, descubrir amiguitos nuevos y crear una gran comunidad.

## 🚀 Características Principales

- **Perfiles de Mascotas**: Configura la información de tu compañero (nombre, raza, biografía).
- **Feed Social y Exploración**: Comparte fotos, visualiza posts de otros usuarios en una estructura tipo Masonry y descubre nuevas mascotas.
- **Interacciones**: Da _Me gusta_, comenta en los posts y sigue a otros perfiles.
- **Notificaciones en Tiempo Real**: Entérate al instante cuando alguien interactúa con tu contenido o comienza a seguirte.
- **Modo Oscuro Integrado**: La aplicación se adapta fluidamente a los temas claros y oscuros del sistema y permite seleccionarlo manualmente.

## 🛠 Tecnologías Utilizadas

- **[Expo](https://expo.dev/) & React Native**: Framework para desarrollo móvil multiplataforma.
- **[Expo Router](https://docs.expo.dev/router/introduction/)**: Sistema de navegación basado en el sistema de archivos.
- **[Supabase](https://supabase.com/)**: Backend (BaaS) utilizado para:
  - Autenticación de usuarios.
  - Base de datos relacional PostgreSQL.
  - Almacenamiento en la nube (Storage) para fotos.
  - Eventos y actualizaciones en tiempo real (Realtime).

## ⚙️ Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior).
- Proyecto base de [Supabase](https://supabase.com/) integrado con sus correspondientes tablas (`profiles`, `pets`, `posts`, `notifications`, etc.) y buckets (storage).
- App **Expo Go** descargada en tu dispositivo para pruebas, o configuradores nativos instalados.

## 🚀 Instalación y Uso

1. **Instalar dependencias**
   En la raíz del proyecto, ejecuta:

   ```bash
   npm install
   ```

2. **Configuración de Variables de Entorno**
   Renombra o crea un archivo `.env` en la raíz del repositorio y vincula tus credenciales de Supabase:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

3. **Iniciar el servidor de desarrollo**

   ```bash
   npx expo start
   ```

   Se desplegará un menú junto a un código QR. En la terminal puedes pulsar:
   - **`a`** para abrir en un emulador de Android.
   - **`i`** para abrir en un simulador de iOS.
   - Alternativamente, escanea el código QR con **Expo Go** (Android) o la app de Cámara (iOS) para correrlo en tu dispositivo físico.

## � Dependencias Principales

Entre las bibliotecas más importantes que utiliza el proyecto se encuentran:

- **`@supabase/supabase-js`**: Cliente oficial para interactuar con la base de datos, el storage y la autenticación de Supabase.
- **`expo-router`**: Sistema principal de manejo de rutas y navegación.
- **`@react-navigation/bottom-tabs`**: Utilizado indirectamente/directamente para las vistas de la barra inferior.
- **`expo-image-picker`**: Permite al usuario seleccionar fotos de la galería o tomar nuevas con la cámara para los posts o avatares.
- **`@expo/vector-icons`**: Iconografía de la interfaz gráfica.
- **`@react-native-async-storage/async-storage`**: Almacenamiento persistente en el dispositivo (utilizado para guardar el tema elegido y sesiones).

## �📁 Estructura Principal

- **`app/`**: Pantallas principales y enrutamiento. Contiene la carpeta `(tabs)` que aloja la navegación inferior (Feed, Buscar, Crear, Notificaciones, Perfil).
- **`components/`**: Componentes reutilizables de UI (ej. tipografías, botones, contenedores temáticos).
- **`hooks/`**: Custom hooks para manejo de estados globales (ej. `useThemeColor`).
- **`constants/`**: Variables fijas, como `theme.ts` donde se define la paleta para Dark/Light Mode.
- **`lib/`**: Lógica de clientes externos, como la instanciación de `supabase.ts`.

---
