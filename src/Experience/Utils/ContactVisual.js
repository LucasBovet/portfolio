import * as THREE from 'three'
import Performance from './Performance.js'

export default class ContactVisual {
    constructor() {
        this.container = document.getElementById('contact-visual')
        if (!this.container) return

        this.width = this.container.clientWidth
        this.height = this.container.clientHeight

        // Scene
        this.scene = new THREE.Scene()

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100)
        this.camera.position.set(0, 0, 8)
        this.scene.add(this.camera)

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        })
        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(Performance.getSuggestedPixelRatio())
        this.container.appendChild(this.renderer.domElement)

        // State
        this.mouse = new THREE.Vector2()
        this.targetRotation = new THREE.Vector2()
        this.isActive = false
        this.rotationSpeed = 0.002
        this.isInView = false

        // Objects
        this.createObjects()
        this.createLights()

        // Bindings
        this.resize = this.resize.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.tick = this.tick.bind(this)

        // Listeners
        window.addEventListener('resize', this.resize)
        this.container.addEventListener('mousemove', this.onMouseMove)
        this.setupInputListeners()
        this.setupVisibilityObserver()
    }

    setupVisibilityObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isInView = entry.isIntersecting
                if (this.isInView) {
                    this.tick()
                }
            })
        }, { threshold: 0.1 })

        observer.observe(this.container)
    }

    createObjects() {
        // Main Sphere (Wireframe)
        const geometry = new THREE.SphereGeometry(2.5, 16, 16)
        const material = new THREE.MeshBasicMaterial({
            color: 0x64ffda,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.scene.add(this.mesh)

        // Inner Sphere (Wireframe)
        const coreGeo = new THREE.SphereGeometry(1.5, 12, 12)
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        })
        this.core = new THREE.Mesh(coreGeo, coreMat)
        this.scene.add(this.core)
    }

    createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(ambient)

        const spot = new THREE.SpotLight(0x64ffda, 5)
        spot.position.set(5, 5, 5)
        spot.lookAt(0, 0, 0)
        this.scene.add(spot)

        // Accent light
        const point = new THREE.PointLight(0xff00ff, 1, 10)
        point.position.set(-2, -2, 2)
        this.scene.add(point)
    }

    setupInputListeners() {
        const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea')

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.isActive = true
                this.mesh.material.opacity = 0.8
                this.mesh.material.color.setHex(0xffffff)
            })
            input.addEventListener('blur', () => {
                this.isActive = false
                this.mesh.material.opacity = 0.3
                this.mesh.material.color.setHex(0x64ffda)
            })
            input.addEventListener('input', () => {
                // Pulse effect on typing
                this.pulse()
            })
        })
    }

    pulse() {
        if (this.mesh) {
            // Instant scale up slightly
            this.mesh.scale.setScalar(1.1)
            this.rotationSpeed = 0.05
        }
    }

    onMouseMove(e) {
        if (!this.container) return
        const rect = this.container.getBoundingClientRect()
        // Normalized coordinates -1 to 1
        this.mouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1
        this.mouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1
    }

    resize() {
        if (!this.container) return
        this.width = this.container.clientWidth
        this.height = this.container.clientHeight

        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.width, this.height)
    }

    tick() {
        if (!this.isInView) return

        // Damping rotation speed back to normal
        let targetSpeed = this.isActive ? 0.02 : 0.002

        if (this.rotationSpeed > targetSpeed) {
            this.rotationSpeed += (targetSpeed - this.rotationSpeed) * 0.05
        } else {
            this.rotationSpeed = targetSpeed
        }

        // Rotate outer mesh
        if (this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed
            this.mesh.rotation.x += this.rotationSpeed

            // Mouse influence
            this.mesh.rotation.y += (this.mouse.x * 0.5 - this.mesh.rotation.y) * 0.05
            this.mesh.rotation.x += (-this.mouse.y * 0.5 - this.mesh.rotation.x) * 0.05

            // Return to normal scale
            this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
        }

        // Rotate core
        if (this.core) {
            this.core.rotation.y -= 0.01
            this.core.rotation.z -= 0.01
        }

        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(this.tick)
    }
}
