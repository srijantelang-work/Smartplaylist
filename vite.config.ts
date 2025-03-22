import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  loadEnv(mode, process.cwd(), '')

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
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            groq: ['groq-sdk'],
          },
          // Ensure proper module format
          format: 'es',
          // Ensure proper file extensions
          entryFileNames: 'assets/[name]-[hash].mjs',
          chunkFileNames: 'assets/[name]-[hash].mjs',
        },
      },
      // Ensure assets are copied correctly
      assetsInlineLimit: 4096,
      emptyOutDir: true,
    },
    // Resolve path aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  }
})

