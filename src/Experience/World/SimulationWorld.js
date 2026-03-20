import * as THREE from 'three'
import Experience from '../Experience.js'
import Player from './Player.js'
import Environment from './Environment.js'

export default class SimulationWorld {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.setFloor()
            this.player = new Player()
            this.environment = new Environment()

            // Camera Orbit Setup
            this.cameraOrbit = {
                theta: Math.PI, // Horizontal angle
                phi: Math.PI * 0.4, // Vertical angle
                distance: 6,
                targetTheta: Math.PI,
                targetPhi: Math.PI * 0.4,
                isDragging: false,
                previousMouse: { x: 0, y: 0 }
            }

            this.setupCameraOrbit()

            // Remove loader
            const loader = document.getElementById('loader')
            if (loader) {
                setTimeout(() => loader.classList.add('fade-out'), 500)
            }
        })
    }

    setupCameraOrbit() {
        const handleStart = (x, y) => {
            this.cameraOrbit.isDragging = true
            this.cameraOrbit.previousMouse.x = x
            this.cameraOrbit.previousMouse.y = y
        }

        const handleMove = (x, y) => {
            if (!this.cameraOrbit.isDragging) return

            const deltaX = x - this.cameraOrbit.previousMouse.x
            const deltaY = y - this.cameraOrbit.previousMouse.y

            this.cameraOrbit.targetTheta -= deltaX * 0.01
            this.cameraOrbit.targetPhi += deltaY * 0.01

            // Clamp vertical angle
            this.cameraOrbit.targetPhi = Math.max(0.1, Math.min(Math.PI * 0.45, this.cameraOrbit.targetPhi))

            this.cameraOrbit.previousMouse.x = x
            this.cameraOrbit.previousMouse.y = y
        }

        const handleEnd = () => {
            this.cameraOrbit.isDragging = false
        }

        window.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY))
        window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY))
        window.addEventListener('mouseup', handleEnd)

        window.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY))
        window.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY))
        window.addEventListener('touchend', handleEnd)
    }

    setFloor() {
        this.floor = {}

        // Geometry
        this.floor.geometry = new THREE.PlaneGeometry(100, 100)

        // Material
        this.floor.material = new THREE.MeshStandardMaterial({
            color: '#1a1a1a',
            roughness: 0.8
        })

        // Mesh
        this.floor.mesh = new THREE.Mesh(this.floor.geometry, this.floor.material)
        this.floor.mesh.rotation.x = - Math.PI * 0.5
        this.floor.mesh.receiveShadow = true
        this.scene.add(this.floor.mesh)

        // Grid helper
        this.floor.grid = new THREE.GridHelper(100, 100, 0x333333, 0x222222)
        this.floor.grid.rotation.x = 0
        this.scene.add(this.floor.grid)
    }

    update() {
        if (this.player) {
            this.player.update()

            // Camera follow (Third Person)
            this.updateCamera()
        }
    }

    updateCamera() {
        const targetModel = this.player.model
        if (!targetModel || !this.cameraOrbit) return

        // Smoothly interpolate angles
        this.cameraOrbit.theta += (this.cameraOrbit.targetTheta - this.cameraOrbit.theta) * 0.1
        this.cameraOrbit.phi += (this.cameraOrbit.targetPhi - this.cameraOrbit.phi) * 0.1

        // Calculate offset from spherical coordinates
        const x = this.cameraOrbit.distance * Math.sin(this.cameraOrbit.phi) * Math.sin(this.cameraOrbit.theta)
        const y = this.cameraOrbit.distance * Math.cos(this.cameraOrbit.phi)
        const z = this.cameraOrbit.distance * Math.sin(this.cameraOrbit.phi) * Math.cos(this.cameraOrbit.theta)

        const orbitOffset = new THREE.Vector3(x, y, z)
        const cameraPosition = targetModel.position.clone().add(orbitOffset)

        // Smoothly move camera
        const experience = this.experience
        experience.camera.instance.position.lerp(cameraPosition, 0.1)

        // Make camera look at character
        const lookAtTarget = targetModel.position.clone()
        lookAtTarget.y += 1.5 // Look at chest/head height
        experience.camera.instance.lookAt(lookAtTarget)

        // Give player the camera's horizontal rotation for relative movement
        this.player.cameraRotation = this.cameraOrbit.theta
    }
}
