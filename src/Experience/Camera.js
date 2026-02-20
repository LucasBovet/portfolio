import * as THREE from 'three'
import Experience from './Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas

        this.setInstance()
        this.setControls()
        this.customUpdate = true
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            35,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        )
        this.instance.position.set(6, 4, 8)
        this.scene.add(this.instance)
    }

    setControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        this.controls.update()

        // Only run custom scroll/parallax logic if enabled
        if (this.customUpdate) {
            // Parallax
            const parallaxX = this.sizes.mouse.x * 0.5
            const parallaxY = this.sizes.mouse.y * 0.5

            // Scroll Logic
            const scrollY = -this.sizes.scroll * 0.01

            this.instance.position.x += (parallaxX - this.instance.position.x) * 0.05
            this.instance.position.y += (scrollY + parallaxY - this.instance.position.y) * 0.05

            // Update controls target
            if (this.controls) {
                this.controls.target.y = scrollY
                this.controls.update()
            }
        }
    }
}
