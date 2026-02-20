import * as THREE from 'three'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'
import Debug from './Utils/Debug.js'
import Resources from './Utils/Resources.js'
import sources from './sources.js'

let instance = null

export default class Experience {
    constructor(canvas, WorldClass = World, customSources = null) {
        if (instance) {
            // Only check for canvas mismatch if a new canvas is actually provided
            // Sub-components call new Experience() with no arguments to get the singleton
            if (canvas && instance.canvas !== canvas) {
                instance.destroy()
                instance = null
            } else {
                return instance
            }
        }
        instance = this

        // Global access
        window.experience = this

        // Options
        this.canvas = canvas

        // Setup
        this.debug = new Debug()
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources(customSources || sources)
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.world = new WorldClass()

        // Resize event
        this.sizes.on('resize', () => {
            this.resize()
        })

        // Time tick event
        this.time.on('tick', () => {
            this.update()
        })
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
    }

    update() {
        this.camera.update()
        this.world.update()
        this.renderer.update()
    }

    destroy() {
        this.sizes.off('resize')
        this.time.off('tick')

        // Traverse the whole scene
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose()

                for (const key in child.material) {
                    const value = child.material[key]

                    if (value && typeof value.dispose === 'function') {
                        value.dispose()
                    }
                }
            }
        })

        if (this.camera && this.camera.controls) {
            this.camera.controls.dispose()
        }

        if (this.renderer && this.renderer.instance) {
            this.renderer.instance.dispose()
        }

        if (this.debug && this.debug.active) {
            this.debug.ui.destroy()
        }
    }
}
