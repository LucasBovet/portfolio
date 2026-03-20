import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Player {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.controls = this.experience.controls

        // Settings
        this.rotationSmoothing = 0.15
        this.moveSpeed = {
            walk: 0.06,
            run: 0.14
        }
        this.cameraRotation = Math.PI // Initialize with default camera angle

        // Setup
        this.resource = this.resources.items.animationIdle
        this.setModel()
        this.setAnimations()
    }

    setModel() {
        this.model = this.resource.scene
        this.model.scale.set(1, 1, 1)
        this.scene.add(this.model)

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })
    }

    setAnimations() {
        this.animations = {}
        this.animations.mixer = new THREE.AnimationMixer(this.model)

        // Helper to find and bind animations from any resource
        const findAnimation = (name, resourceKey) => {
            const res = this.resources.items[resourceKey]
            if (!res || !res.animations.length) return null

            // Mixamo animations are often named "mixamo.com" or "Take 001"
            // We take the best match or just the first one
            const clip = res.animations[0]
            const action = this.animations.mixer.clipAction(clip)

            // console.log(`[Simulation] Found animation for ${name}: "${clip.name}"`)
            return action
        }

        this.animations.idle = findAnimation('idle', 'animationIdle')
        this.animations.walk = findAnimation('walk', 'animationWalk')
        this.animations.run = findAnimation('run', 'animationRun')

        // Start playing something
        this.animations.current = this.animations.idle || this.animations.walk
        if (this.animations.current) {
            this.animations.current.play()
        }
    }

    update() {
        this.animations.mixer.update(this.time.delta * 0.001)

        const { forward, backward, left, right, run } = this.controls.actions
        const isMoving = forward || backward || left || right

        // --- Logic for Animation State ---
        let newAction = this.animations.idle

        if (isMoving) {
            newAction = (run && this.animations.run) ? this.animations.run : this.animations.walk
        }

        // If even the idle is missing, we must ensure we don't keep walking
        if (!newAction && !isMoving && this.animations.current === this.animations.walk) {
            this.animations.walk.stop()
            this.animations.current = null
        }

        // Transition if state changed
        if (newAction && this.animations.current !== newAction) {
            const oldAction = this.animations.current
            newAction.reset().fadeIn(0.2).play()

            if (oldAction) {
                oldAction.fadeOut(0.2)
            }

            this.animations.current = newAction
            // console.log(`[Simulation] Moving to: ${isMoving ? (run ? 'RUN' : 'WALK') : 'IDLE'}`)
        }

        // --- Logic for Movement ---
        if (isMoving) {
            let localTargetAngle = 0

            // Base angles relative to a fixed forward
            if (forward) {
                if (left) localTargetAngle = Math.PI * 0.25
                else if (right) localTargetAngle = -Math.PI * 0.25
                else localTargetAngle = 0
            } else if (backward) {
                if (left) localTargetAngle = Math.PI * 0.75
                else if (right) localTargetAngle = -Math.PI * 0.75
                else localTargetAngle = Math.PI
            } else if (left) {
                localTargetAngle = Math.PI * 0.5
            } else if (right) {
                localTargetAngle = -Math.PI * 0.5
            }

            // Apply camera rotation to make movement relative to the view
            // cameraRotation + Math.PI aligns the camera's angle with the world space forward
            const targetAngle = localTargetAngle + (this.cameraRotation || Math.PI) + Math.PI

            // Smooth Turn
            const currentRotation = this.model.rotation.y
            let diff = targetAngle - currentRotation
            while (diff < -Math.PI) diff += Math.PI * 2
            while (diff > Math.PI) diff -= Math.PI * 2
            this.model.rotation.y += diff * this.rotationSmoothing

            // Move
            const speed = run ? this.moveSpeed.run : this.moveSpeed.walk
            const velocity = new THREE.Vector3(0, 0, 1)
            velocity.applyQuaternion(this.model.quaternion)
            velocity.y = 0

            this.model.position.addScaledVector(velocity.normalize(), speed)
        }
    }
}
