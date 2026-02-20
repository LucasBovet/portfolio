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

            // Remove loader
            const loader = document.getElementById('loader')
            if (loader) {
                loader.classList.add('fade-out')
            }
        })
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
        if (!targetModel) return

        // Desired relative position of the camera
        const relativeCameraOffset = new THREE.Vector3(0, 3, -6)

        // Transform the relative offset to world space based on model's position/rotation
        const cameraOffset = relativeCameraOffset.applyMatrix4(targetModel.matrixWorld)

        // Smoothly move camera
        const experience = this.experience
        experience.camera.instance.position.lerp(cameraOffset, 0.1)

        // Make camera look at character
        const lookAtTarget = targetModel.position.clone()
        lookAtTarget.y += 1.5 // Look at chest/head height
        experience.camera.instance.lookAt(lookAtTarget)
    }
}
