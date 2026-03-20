
import * as THREE from 'three'
import Experience from '../Experience.js'
import Environment from './Environment.js'
import Carousel from './Carousel.js'
import ProjectGallery from './ProjectGallery.js'

export default class World {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        // Resources
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup Hero Model Container
            this.heroGroup = new THREE.Group()
            this.scene.add(this.heroGroup)

            const model = this.resources.items.heroModel.scene

            // Calculate center
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())

            // Center model inside the group
            model.position.x = -center.x
            model.position.y = -center.y
            model.position.z = -center.z

            this.heroGroup.add(model)

            // Apply scale to group
            this.heroGroup.scale.set(0.35, 0.35, 0.35)

            // Initial position (offset to the right for composition)
            this.heroGroup.position.set(2, 0, 0)

            // Initial Responsive Setup
            this.updateHeroResponsive()

            // Reference for rotation in update()
            this.mesh = this.heroGroup

            // Mouse Interaction for Hero Model
            this.raycaster = new THREE.Raycaster()
            this.mouse = new THREE.Vector2()
            this.isDragging = false
            this.previousMousePosition = { x: 0, y: 0 }

            window.addEventListener('pointerdown', (e) => {
                if (!this.experience.camera.instance) return
                
                this.mouse.x = (e.clientX / this.experience.sizes.width) * 2 - 1
                this.mouse.y = -(e.clientY / this.experience.sizes.height) * 2 + 1
                
                this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance)
                const intersects = this.raycaster.intersectObject(this.heroGroup, true)
                
                if (intersects.length > 0) {
                    this.isDragging = true
                    this.previousMousePosition = { x: e.clientX, y: e.clientY }
                    document.body.style.cursor = 'grabbing'
                }
            })

            window.addEventListener('pointermove', (e) => {
                if (this.isDragging && this.heroGroup) {
                    const deltaMove = {
                        x: e.clientX - this.previousMousePosition.x,
                        y: e.clientY - this.previousMousePosition.y
                    }

                    this.heroGroup.rotation.y += deltaMove.x * 0.01
                    this.heroGroup.rotation.x += deltaMove.y * 0.01

                    this.previousMousePosition = { x: e.clientX, y: e.clientY }
                } else if (this.experience.camera.instance) {
                    // Update cursor to pointer if hovering over model
                    this.mouse.x = (e.clientX / this.experience.sizes.width) * 2 - 1
                    this.mouse.y = -(e.clientY / this.experience.sizes.height) * 2 + 1
                    this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance)
                    
                    // Only raycast if heroGroup is active and visible
                    if(this.heroGroup.visible) {
                        const intersects = this.raycaster.intersectObject(this.heroGroup, true)
                        if (intersects.length > 0) {
                            document.body.style.cursor = 'grab'
                        } else if (document.body.style.cursor === 'grab' || document.body.style.cursor === 'grabbing') {
                            document.body.style.cursor = 'default'
                        }
                    }
                }
            })

            window.addEventListener('pointerup', () => {
                this.isDragging = false
                if(document.body.style.cursor === 'grabbing') {
                    document.body.style.cursor = 'default'
                }
            })

            // Listen for resize
            this.experience.sizes.on('resize', () => {
                this.updateHeroResponsive()
            })

            // Add to debug only after loaded
            if (this.experience.debug.active) {
                const debugFolder = this.experience.debug.ui.addFolder('Hero Model')
                debugFolder.add(this.heroGroup.scale, 'x').min(0).max(2).step(0.01).name('Scale').onChange((val) => {
                    this.heroGroup.scale.set(val, val, val)
                })
                debugFolder.add(this.heroGroup.position, 'x').min(-10).max(10).step(0.1).name('Position X')
                debugFolder.add(this.heroGroup.position, 'y').min(-10).max(10).step(0.1).name('Position Y')
                debugFolder.add(this.heroGroup.position, 'z').min(-10).max(10).step(0.1).name('Position Z')
            }
        })

        // Illustrations Carousel
        this.carousel = new Carousel()

        this.updateCarouselPosition()

        // Debug
        if (this.experience.debug.active) {
            this.debugFolder = this.experience.debug.ui.addFolder('World')
            this.debugFolder.add(this.carousel.group.position, 'y')
                .min(-100)
                .max(10)
                .step(0.1)
                .name('Carousel Y')
        }

        // Setup environment
        this.environment = new Environment()

        // Project Gallery (Liquid Distortion) - Currently unused/replaced by iframes
        // this.projectGallery = new ProjectGallery()
    }


    updateHeroResponsive() {
        // Hero Model
        if (this.heroGroup) {
            if (this.experience.sizes.width < 768) {
                // Mobile
                this.heroGroup.position.set(0, 0.5, -1)
                this.heroGroup.scale.set(0.25, 0.25, 0.25)
            } else {
                // Desktop
                this.heroGroup.position.set(2, 0, 0)
                this.heroGroup.scale.set(0.35, 0.35, 0.35)
            }
        }

        // Mobile adjustment
        this.updateCarouselPosition()
    }

    updateCarouselPosition() {
        if (!this.carousel || !this.carousel.group) return

        const section = document.getElementById('illustrations')
        if (section) {
            // Calculate 3D position based on DOM offset
            // We correspond the DOM pixel offset to the 3D world Y (factor 0.01 matches Camera logic)
            // The value is negative because scrolling down moves camera to negative Y
            let domY = -section.offsetTop * 0.01

            // Fine-tuning offset
            if (this.experience.sizes.width < 768) {
                domY -= 1 // Move slightly lower on mobile
            }

            this.carousel.group.position.y = domY
        }
    }

    update() {
        // Handle dynamic height changes (like updates loading)
        this.updateCarouselPosition()

        if (this.mesh) {
            if (!this.isDragging) {
                this.mesh.rotation.y += 0.005
                this.mesh.rotation.x += 0.002
            }

            // Fade out based on scroll
            const scrollY = this.experience.sizes.scroll
            const fadeStart = 0
            const fadeEnd = 800

            let opacity = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)
            opacity = Math.max(0, Math.min(1, opacity))

            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (!child.material._initialOpacity) child.material._initialOpacity = child.material.opacity
                    child.material.transparent = true
                    child.material.opacity = opacity * (child.material._initialOpacity || 1)
                }
            })

            this.mesh.visible = opacity > 0
        }

        if (this.carousel) {
            this.carousel.update()
        }

        // if (this.projectGallery) {
        //     this.projectGallery.update()
        // }
    }
}
