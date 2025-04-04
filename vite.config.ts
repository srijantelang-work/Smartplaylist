import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const isProd = mode === 'production'

  return {
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    build: {
      sourcemap: !isProd,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            groq: ['groq-sdk'],
          },
          // Ensure proper module format and extensions
          format: 'es',
          entryFileNames: 'assets/[name].[hash].mjs',
          chunkFileNames: 'assets/[name].[hash].mjs',
          assetFileNames: ({ name = '' }) => {
            if (/\.(gif|jpe?g|png|svg|webp)$/.test(name)) {
              return 'assets/images/[name].[hash][extname]'
            }
            if (/\.(woff2?|ttf|otf|eot)$/.test(name)) {
              return 'assets/fonts/[name].[hash][extname]'
            }
            if (/\.css$/.test(name)) {
              return 'assets/styles/[name].[hash][extname]'
            }
            return 'assets/[name].[hash][extname]'
          }
        },
      },
      // Ensure assets are copied correctly
      assetsInlineLimit: 4096,
      emptyOutDir: true,
      // Modern browser targets
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      cssTarget: ['chrome87', 'safari14'],
    },
    // Resolve path aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  }
})

