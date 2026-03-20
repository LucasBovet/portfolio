import * as THREE from 'three'
import Experience from '../Experience.js'
import { gsap } from 'gsap'

export default class Carousel {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.time = this.experience.time
        this.sizes = this.experience.sizes

        // Group to hold the carousel
        this.group = new THREE.Group()
        this.scene.add(this.group)

        // Parameters
        this.radius = 2.5
        this.count = 5
        this.planeSize = { width: 1.5, height: 2 }

        // Mouse interaction
        this.targetRotation = 0
        this.currentRotation = 0
        this.isDragging = false
        this.previousMouseX = 0

        this.setupCarousel()
        this.setupInteraction()

        // Hide initially if we want to show it only on scroll, 
        // but for now let's keep it and maybe position it down?
        // Actually, let's keep it at 0,0,0 but we will move the whole group usually.
        // For this specific request, let's position it far away or handle visibility later.
        // For now, I'll place it slightly off-screen or relying on Camera movement.
        // Let's rely on the main "World" to position it appropriately.
        this.group.position.y = -10 // Temporary placement logic
    }

    setupCarousel() {
        const geometry = new THREE.PlaneGeometry(this.planeSize.width, this.planeSize.height)
        const textureLoader = new THREE.TextureLoader()

        const illustrationFiles = [
            'illustration_1.webp',
            'illustration_2.webp',
            'illustration_3.webp',
            'illustration_4.webp',
            'illustration_5.webp'
        ]

        this.count = illustrationFiles.length

        for (let i = 0; i < this.count; i++) {
            const texture = textureLoader.load(`./illustrations/${illustrationFiles[i]}`,
                // onLoad
                (tex) => { tex.colorSpace = THREE.SRGBColorSpace },
                // onProgress
                undefined,
                // onError - handle missing texture gracefully by using fallback color
                () => { console.warn(`Could not load texture: ${illustrationFiles[i]}`) }
            )

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            })

            // Fallback color in case texture fails/loads late
            material.color.setHex(0xffffff)

            const mesh = new THREE.Mesh(geometry, material)

            // Position in circle
            const angle = (i / this.count) * Math.PI * 2
            mesh.position.x = Math.cos(angle) * this.radius
            mesh.position.z = Math.sin(angle) * this.radius

            // Rotate to face center (or outward)
            mesh.rotation.y = -angle + Math.PI / 2

            this.group.add(mesh)
        }
    }

    setupInteraction() {
        window.addEventListener('mousedown', (event) => {
            this.isDragging = true
            this.previousMouseX = event.clientX
        })

        window.addEventListener('mousemove', (event) => {
            if (this.isDragging) {
                const delta = event.clientX - this.previousMouseX
                this.targetRotation += delta * 0.005
                this.previousMouseX = event.clientX
            }
        })

        window.addEventListener('mouseup', () => {
            this.isDragging = false
        })

        // Touch support
        window.addEventListener('touchstart', (event) => {
            this.isDragging = true
            this.previousMouseX = event.touches[0].clientX
        })

        window.addEventListener('touchmove', (event) => {
            if (this.isDragging) {
                const delta = event.touches[0].clientX - this.previousMouseX
                this.targetRotation += delta * 0.005
                this.previousMouseX = event.touches[0].clientX
            }
        })

        window.addEventListener('touchend', () => {
            this.isDragging = false
        })
    }

    update() {
        // Smooth rotation
        this.currentRotation += (this.targetRotation - this.currentRotation) * 0.05
        this.group.rotation.y = this.currentRotation
    }
}
