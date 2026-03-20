
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Experience from '../Experience.js'

const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true'

// KineticType extends nothing but acts as World
export default class KineticType {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.time = this.experience.time
        this.debug = this.experience.debug
        this.camera = this.experience.camera
        this.renderer = this.experience.renderer

        // Configure Camera for this scene
        this.camera.customUpdate = false
        this.camera.instance.position.set(5, 5, 15)
        this.camera.controls.enableDamping = true
        this.camera.controls.target.set(0, -5, 0)

        // Setup
        this.objectsToUpdate = []
        this.initPhysics()
        this.createEnvironment()
        this.createLights()
        this.createType()
        this.setupInteraction()

        // Debug
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('KineticType')
        }
    }

    initPhysics() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, -9.82, 0)

        // Materials
        this.defaultMaterial = new CANNON.Material('default')
        this.defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.1,
                restitution: 0.7
            }
        )
        this.world.addContactMaterial(this.defaultContactMaterial)
    }

    createEnvironment() {
        // Floor
        const floorShape = new CANNON.Plane()
        const floorBody = new CANNON.Body()
        floorBody.mass = 0
        floorBody.addShape(floorShape)
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
        floorBody.position.y = -5
        this.world.addBody(floorBody)

        // Visual Floor (Optional Grid)
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
        gridHelper.position.y = -5
        this.scene.add(gridHelper)
    }

    createType() {
        // Placeholder for 3D Text logic
        // We'll create simple blocks for now to represent letters

        const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
        const boxMaterial = new THREE.MeshStandardMaterial({
            metalness: 0.3,
            roughness: 0.4,
            color: 0x64ffda
        })

        for (let i = 0; i < 5; i++) {
            this.createBox(
                boxGeometry,
                boxMaterial,
                { x: (Math.random() - 0.5) * 3, y: 5 + i * 2, z: (Math.random() - 0.5) * 3 }
            )
        }
    }

    createBox(geometry, material, position) {
        // Three.js Mesh
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.position.copy(position)
        this.scene.add(mesh)

        // Cannon.js Body
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 0, 0),
            shape: shape,
            material: this.defaultMaterial
        })
        body.position.copy(position)
        this.world.addBody(body)

        // Save for update
        this.objectsToUpdate.push({ mesh, body })
    }

    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
        directionalLight.castShadow = !isPreview
        if (directionalLight.castShadow) {
            directionalLight.shadow.mapSize.set(1024, 1024)
            directionalLight.shadow.camera.far = 15
            directionalLight.shadow.camera.left = -7
            directionalLight.shadow.camera.top = 7
            directionalLight.shadow.camera.right = 7
            directionalLight.shadow.camera.bottom = -7
        }
        directionalLight.position.set(5, 5, 5)
        this.scene.add(directionalLight)
    }

    setupInteraction() {
        // Raycaster for picking
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
        })

        // Dragging Logic
        this.isDragging = false
        this.draggedBody = null

        // Simplified "Physics Mouse Constraint"
        // When clicking, we create a kinematic body at mouse position and constrain the clicked body to it

        window.addEventListener('mousedown', () => {
            this.raycaster.setFromCamera(this.mouse, this.camera.instance)
            const intersects = this.raycaster.intersectObjects(this.objectsToUpdate.map(obj => obj.mesh))

            if (intersects.length > 0) {
                const hitObject = intersects[0].object
                // Find corresponding physics body
                const objectData = this.objectsToUpdate.find(obj => obj.mesh === hitObject)

                if (objectData) {
                    this.isDragging = true
                    this.draggedBody = objectData.body

                    // Disable Camera Controls while dragging
                    this.camera.controls.enabled = false

                    // Create constraint
                    // For simplicity in this demo: we just push the body up or apply force towards mouse
                    // A proper mouse constraint requires a PivotJoint

                    this.addMouseConstraint(intersects[0].point, objectData.body)
                }
            }
        })

        window.addEventListener('mouseup', () => {
            this.camera.controls.enabled = true
            this.removeMouseConstraint()
        })

        window.addEventListener('mousemove', (e) => {
            if (this.mouseConstraintBody) {
                // Determine 3D position of mouse
                // We project mouse onto a plane at the depth of the object
                this.moveJointToMouse()
            }
        })
    }

    addMouseConstraint(position, body) {
        // Joint Body (Kinematic, follows mouse)
        this.mouseConstraintBody = new CANNON.Body({
            mass: 0, // Static/Kinematic
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: new CANNON.Sphere(0.1)
        })
        this.mouseConstraintBody.collisionFilterGroup = 0
        this.mouseConstraintBody.collisionFilterMask = 0
        this.world.addBody(this.mouseConstraintBody)

        // Joint
        const localPivotBody = new CANNON.Vec3(0, 0, 0)
        const localPivotMouse = new CANNON.Vec3(0, 0, 0)

        // Transform world point to local
        body.pointToLocalFrame(new CANNON.Vec3(position.x, position.y, position.z), localPivotBody)

        this.mouseConstraint = new CANNON.PointToPointConstraint(
            body, localPivotBody,
            this.mouseConstraintBody, localPivotMouse
        )
        this.world.addConstraint(this.mouseConstraint)
    }

    removeMouseConstraint() {
        if (this.mouseConstraint) {
            this.world.removeConstraint(this.mouseConstraint)
            this.mouseConstraint = null
        }
        if (this.mouseConstraintBody) {
            this.world.removeBody(this.mouseConstraintBody)
            this.mouseConstraintBody = null
        }
    }

    moveJointToMouse(e) {
        // Plane at z=0 (or specific depth) logic is simple,
        // but robust picking requires intersecting a virtual plane facing camera

        // Simple approximation: Unproject mouse at specific distance
        // We need to find the point on a plane that passes through the object

        // Raycast against an invisible plane
        if (!this.dragPlane) {
            this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        }

        this.raycaster.setFromCamera(this.mouse, this.camera.instance)
        const target = new THREE.Vector3()
        this.raycaster.ray.intersectPlane(this.dragPlane, target)

        if (target) {
            this.mouseConstraintBody.position.set(target.x, target.y, target.z)
        }
    }

    update() {
        this.world.step(1 / 60, this.time.delta, isPreview ? 2 : 3)

        for (const object of this.objectsToUpdate) {
            object.mesh.position.copy(object.body.position)
            object.mesh.quaternion.copy(object.body.quaternion)
        }
    }
}
