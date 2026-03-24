import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import viteCompression from 'vite-plugin-compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    root: './',
    plugins: [
        viteCompression()
    ],
    server: {
        watch: {
            ignored: ['**/api/**']
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                kinetic: resolve(__dirname, 'kinetic.html'),
                simulation: resolve(__dirname, 'simulation.html'),
                visualiser: resolve(__dirname, 'visualiser.html'),
                physics: resolve(__dirname, 'physics.html'),
                admin: resolve(__dirname, 'admin.html'),
                image3d: resolve(__dirname, 'image-to-3d.html')
            }
        },
        chunkSizeWarningLimit: 1000
    }
})
