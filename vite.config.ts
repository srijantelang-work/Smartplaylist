import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

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
          // Ensure proper file extensions and asset handling
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        },
      },
      // Ensure assets are copied correctly
      assetsInlineLimit: 4096,
      emptyOutDir: true,
      // Add CSP headers
      target: 'esnext',
      cssTarget: 'chrome61',
    },
    // Resolve path aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  }
})

