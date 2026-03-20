import './styles/visualiser.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import gsap from 'gsap';

const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

class App {
    constructor() {
        this.mode = 'draw';
        this.drawItem = 'wall';
        this.walls = [];
        this.furniture = [];
        this.selectedFurniture = null;
        this.isDrawing = false;
        this.currentWall = null;
        this.snapSize = 10;
        this.pixelsPerMeter = 100;
        this.roomCenter = new THREE.Vector3(0, 0, 0);

        this.canvas2d = document.getElementById('grid-canvas');
        this.ctx = this.canvas2d.getContext('2d');
        this.viewport = document.getElementById('canvas-container');
        this.furniturePanel = document.getElementById('furniture-panel');
        this.structureSection = document.getElementById('structure-section');
        this.furnitureSection = document.getElementById('furniture-section');
        this.instructions = document.getElementById('instructions');

        this.dimLabel = document.createElement('div');
        this.dimLabel.className = 'dimension-label';
        this.dimLabel.style.display = 'none';
        this.viewport.appendChild(this.dimLabel);

        this.drawBtn = document.getElementById('draw-mode-btn');
        this.viewBtn = document.getElementById('view-mode-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.generateBtn = document.getElementById('generate-btn');

        this.init();
    }

    init() {
        this.setup2DCanvas();
        this.setup3DScene();
        this.addEventListeners();
        this.animate();
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        this.setMode('draw');
    }

    setup2DCanvas() {
        this.canvas2d.width = this.viewport.clientWidth;
        this.canvas2d.height = this.viewport.clientHeight;
    }

    setup3DScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.camera = new THREE.PerspectiveCamera(60, this.viewport.clientWidth / this.viewport.clientHeight, 1, 10000);
        this.camera.position.set(800, 800, 800);

        this.renderer = new THREE.WebGLRenderer({
            antialias: !isPreview,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.viewport.clientWidth, this.viewport.clientHeight);
        this.renderer.setPixelRatio(isPreview ? 1 : Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = !isPreview;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.domElement.id = 'three-canvas';
        this.renderer.domElement.style.display = 'none';
        this.viewport.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value;
        });
        this.scene.add(this.transformControls);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(1000, 1500, 1000);
        directionalLight.castShadow = !isPreview;
        if (directionalLight.castShadow) {
            directionalLight.shadow.camera.left = -2000;
            directionalLight.shadow.camera.right = 2000;
            directionalLight.shadow.camera.top = 2000;
            directionalLight.shadow.camera.bottom = -2000;
            directionalLight.shadow.mapSize.width = isPreview ? 512 : 2048;
            directionalLight.shadow.mapSize.height = isPreview ? 512 : 2048;
        }
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0x64ffda, 0.4);
        fillLight.position.set(-800, 500, -800);
        this.scene.add(fillLight);

        const gridHelper = new THREE.GridHelper(4000, 40, 0x1e293b, 0x0f172a);
        this.scene.add(gridHelper);
    }

    addEventListeners() {
        this.drawBtn.addEventListener('click', () => this.setMode('draw'));
        this.viewBtn.addEventListener('click', () => this.setMode('view'));
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.generateBtn.addEventListener('click', () => this.setMode('view'));

        document.querySelectorAll('.draw-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.draw-item-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.drawItem = btn.dataset.type;
                const msg = this.drawItem === 'wall' ? 'Click and drag to draw walls' : `Click a wall to place a ${this.drawItem}`;
                this.instructions.textContent = msg;
            });
        });

        this.canvas2d.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas2d.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas2d.addEventListener('mouseup', () => this.stopDrawing());

        // Touch Support
        this.canvas2d.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        }, { passive: false });
        this.canvas2d.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });
        this.canvas2d.addEventListener('touchend', () => this.stopDrawing());

        document.querySelectorAll('.furniture-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                if (this.mode !== 'view') {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('type', item.dataset.type);
            });
        });

        this.renderer.domElement.addEventListener('dragover', (e) => e.preventDefault());
        this.renderer.domElement.addEventListener('drop', (e) => this.handleDrop(e));
        this.renderer.domElement.addEventListener('mousedown', (e) => this.handle3DClick(e));
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            // Only trigger if not already handled by UI or transform controls
            if (this.mode === 'view') {
                this.handle3DClick(e.touches[0]);
            }
        }, { passive: true });
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        this.toggleLibraryBtn = document.getElementById('toggle-library-btn');
        this.closeLibraryBtn = document.getElementById('close-library-btn');
        this.mobileOverlay = document.getElementById('mobile-overlay');

        if (this.toggleLibraryBtn) this.toggleLibraryBtn.addEventListener('click', () => this.toggleLibrary(true));
        if (this.closeLibraryBtn) this.closeLibraryBtn.addEventListener('click', () => this.toggleLibrary(false));
        if (this.mobileOverlay) this.mobileOverlay.addEventListener('click', () => this.toggleLibrary(false));
    }

    toggleLibrary(show) {
        if (show) {
            this.furniturePanel.classList.add('active');
            this.furniturePanel.classList.remove('hidden');
            if (this.mobileOverlay) this.mobileOverlay.classList.remove('hidden');
        } else {
            this.furniturePanel.classList.remove('active');
            this.furniturePanel.classList.add('hidden');
            if (this.mobileOverlay) this.mobileOverlay.classList.add('hidden');
        }
    }

    handleResize() {
        const w = this.viewport.clientWidth;
        const h = this.viewport.clientHeight;
        this.canvas2d.width = w;
        this.canvas2d.height = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.drawGrid();
    }

    setMode(mode) {
        this.mode = mode;
        if (mode === 'draw') {
            this.drawBtn.classList.add('active');
            this.viewBtn.classList.remove('active');
            this.canvas2d.style.display = 'block';
            this.renderer.domElement.style.display = 'none';
            this.furniturePanel.classList.remove('hidden');
            this.structureSection.style.display = 'block';
            this.furnitureSection.style.display = 'none';
            this.instructions.textContent = 'Draw walls, doors, or windows';
            this.transformControls.detach();
        } else {
            this.viewBtn.classList.add('active');
            this.drawBtn.classList.remove('active');
            this.canvas2d.style.display = 'none';
            this.renderer.domElement.style.display = 'block';
            this.furniturePanel.classList.remove('hidden');
            this.structureSection.style.display = 'none';
            this.furnitureSection.style.display = 'block';
            this.instructions.textContent = 'Drag furniture or click item to move';
            this.generate3D();
        }
    }

    clearAll() {
        this.walls = [];
        this.furniture.forEach(f => this.scene.remove(f.mesh));
        this.furniture = [];
        this.transformControls.detach();
        this.drawGrid();
        this.scene.children.filter(c => c.name === 'structure').forEach(w => this.scene.remove(w));
    }

    getMousePos(e) {
        const rect = this.canvas2d.getBoundingClientRect();
        // Handle both mouse and touch coordinates
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        return {
            x: Math.round(x / this.snapSize) * this.snapSize,
            y: Math.round(y / this.snapSize) * this.snapSize
        };
    }

    startDrawing(e) {
        if (this.mode !== 'draw') return;
        const pos = this.getMousePos(e);
        if (this.drawItem === 'wall') {
            this.isDrawing = true;
            this.currentWall = { start: pos, end: pos, type: 'wall' };
        } else {
            const snappedPos = this.getPosOnWall(pos);
            if (snappedPos) {
                this.isDrawing = true;
                this.currentWall = { start: snappedPos, end: snappedPos, type: this.drawItem };
            }
        }
    }

    getPosOnWall(pos) {
        let closest = null;
        let minDist = 20;
        this.walls.filter(w => w.type === 'wall').forEach(w => {
            const d = this.distToSegment(pos, w.start, w.end);
            if (d < minDist) {
                minDist = d;
                closest = this.projectPointOnSegment(pos, w.start, w.end);
            }
        });
        return closest;
    }

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 == 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
    }

    projectPointOnSegment(p, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);
        if (this.drawItem === 'wall') {
            this.currentWall.end = pos;
        } else {
            const snappedEnd = this.getPosOnWall(pos);
            if (snappedEnd) this.currentWall.end = snappedEnd;
        }
        const dx = this.currentWall.end.x - this.currentWall.start.x;
        const dy = this.currentWall.end.y - this.currentWall.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const meters = (dist / this.pixelsPerMeter).toFixed(2);
        this.dimLabel.style.display = 'block';
        this.dimLabel.style.left = `${this.currentWall.end.x}px`;
        this.dimLabel.style.top = `${this.currentWall.end.y}px`;
        this.dimLabel.textContent = `${meters}m`;
        this.drawGrid();
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.dimLabel.style.display = 'none';
        if (this.currentWall.start.x !== this.currentWall.end.x || this.currentWall.start.y !== this.currentWall.end.y) {
            this.walls.push(this.currentWall);
        }
        this.isDrawing = false;
        this.currentWall = null;
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas2d.width, this.canvas2d.height);
        this.walls.forEach(w => this.renderWall2D(w));
        if (this.currentWall) this.renderWall2D(this.currentWall, true);
    }

    renderWall2D(w, isCurrent = false) {
        const color = w.type === 'door' ? '#fbbf24' : (w.type === 'window' ? '#38bdf8' : '#64ffda');
        this.ctx.strokeStyle = isCurrent ? color + '88' : color;
        this.ctx.lineWidth = w.type === 'wall' ? 6 : 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(w.start.x, w.start.y);
        this.ctx.lineTo(w.end.x, w.end.y);
        this.ctx.stroke();
        if (w.type === 'door') {
            const angle = Math.atan2(w.end.y - w.start.y, w.end.x - w.start.x);
            this.ctx.beginPath();
            this.ctx.arc(w.start.x, w.start.y, 30, angle, angle - Math.PI / 2, true);
            this.ctx.stroke();
        }
    }

    generate3D() {
        this.scene.children.filter(c => c.name === 'structure').forEach(w => this.scene.remove(w));
        const wallHeight = 250;
        const wallThickness = 15;
        this.walls.forEach(wall => {
            const dx = wall.end.x - wall.start.x;
            const dy = wall.end.y - wall.start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            let geometry, material;
            if (wall.type === 'wall') {
                geometry = new THREE.BoxGeometry(distance, wallHeight, wallThickness);
                material = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
            } else if (wall.type === 'door') {
                geometry = new THREE.BoxGeometry(distance, wallHeight * 0.8, wallThickness * 0.6);
                material = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.2 });
            } else {
                geometry = new THREE.BoxGeometry(distance, wallHeight * 0.4, wallThickness * 0.2);
                material = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.6, metalness: 0.8, roughness: 0.1 });
            }
            const mesh = new THREE.Mesh(geometry, material);
            const centerX = (wall.start.x + wall.end.x) / 2 - this.canvas2d.width / 2;
            const centerZ = (wall.start.y + wall.end.y) / 2 - this.canvas2d.height / 2;
            mesh.position.set(centerX, (wall.type === 'window' ? wallHeight * 0.6 : (wall.type === 'door' ? wallHeight * 0.4 : wallHeight / 2)), centerZ);
            mesh.rotation.y = -angle;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = 'structure';
            this.scene.add(mesh);
        });

        if (this.walls.length > 0) {
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
            this.walls.forEach(w => {
                const cx1 = w.start.x - this.canvas2d.width / 2;
                const cz1 = w.start.y - this.canvas2d.height / 2;
                const cx2 = w.end.x - this.canvas2d.width / 2;
                const cz2 = w.end.y - this.canvas2d.height / 2;
                minX = Math.min(minX, cx1, cx2); maxX = Math.max(maxX, cx1, cx2);
                minZ = Math.min(minZ, cz1, cz2); maxZ = Math.max(maxZ, cz1, cz2);
            });
            this.roomCenter.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
        }

        if (!this.floor) {
            const floorGeom = new THREE.PlaneGeometry(4000, 4000);
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
            this.floor = new THREE.Mesh(floorGeom, floorMat);
            this.floor.rotation.x = -Math.PI / 2;
            this.floor.receiveShadow = true;
            this.scene.add(this.floor);
        }
    }

    handle3DClick(e) {
        if (this.mode !== 'view') return;
        const rect = this.renderer.domElement.getBoundingClientRect();

        // Handle both mouse and touch coordinates
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const mouse = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const furnitureMeshes = [];
        this.furniture.forEach(f => {
            f.mesh.traverse(child => { if (child.isMesh) furnitureMeshes.push(child); });
        });
        const intersects = raycaster.intersectObjects(furnitureMeshes, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && !this.furniture.some(f => f.mesh === obj)) {
                obj = obj.parent;
            }
            this.selectFurniture(obj);
        } else {
            if (!this.transformControls.dragging) {
                this.deselectFurniture();
            }
        }
    }

    selectFurniture(mesh) {
        const furnitureItem = this.furniture.find(f => f.mesh === mesh);
        if (furnitureItem) {
            this.selectedFurniture = furnitureItem;
            this.transformControls.attach(mesh);
            this.transformControls.visible = true;
            this.instructions.textContent = `Selected ${this.selectedFurniture.type}. R to rotate, Del to remove.`;
        }
    }

    deselectFurniture() {
        this.selectedFurniture = null;
        this.transformControls.detach();
        this.transformControls.visible = false;
    }

    handleKeyDown(e) {
        if (!this.selectedFurniture) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.scene.remove(this.selectedFurniture.mesh);
            this.furniture = this.furniture.filter(f => f !== this.selectedFurniture);
            this.deselectFurniture();
        }
        if (e.key === 'r' || e.key === 'R') {
            this.selectedFurniture.mesh.rotation.y += Math.PI / 2;
        }
    }

    handleDrop(e) {
        const type = e.dataTransfer.getData('type');
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObject(this.floor);
        if (intersects.length > 0) this.addFurniture(type, intersects[0].point);
    }

    addFurniture(type, position) {
        const group = new THREE.Group();
        let meshColor;
        switch (type) {
            case 'sofa':
                meshColor = 0xef4444;
                const base = new THREE.Mesh(new THREE.BoxGeometry(180, 35, 80), new THREE.MeshStandardMaterial({ color: meshColor }));
                const back = new THREE.Mesh(new THREE.BoxGeometry(180, 45, 15), new THREE.MeshStandardMaterial({ color: meshColor }));
                back.position.set(0, 25, -32);
                group.add(base, back);
                group.position.y += 17.5;
                break;
            case 'table':
                meshColor = 0xf59e0b;
                const top = new THREE.Mesh(new THREE.BoxGeometry(110, 6, 70), new THREE.MeshStandardMaterial({ color: meshColor }));
                top.position.y = 72;
                group.add(top);
                break;
            case 'bed':
                meshColor = 0x3b82f6;
                const mattress = new THREE.Mesh(new THREE.BoxGeometry(140, 22, 190), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                mattress.position.y = 22;
                group.add(mattress);
                break;
            case 'lamp':
                const baseL = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 6, 16), new THREE.MeshStandardMaterial({ color: 0x334155 }));
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 140, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
                pole.position.y = 70;
                group.add(baseL, pole);
                break;
        }
        group.position.x = position.x;
        group.position.z = position.z;
        group.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
                if (c.material) c.material = c.material.clone();
            }
        });
        this.scene.add(group);
        this.furniture.push({ mesh: group, type, position: group.position.clone() });
        this.selectFurniture(group);
        group.scale.set(0, 0, 0);
        gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out' });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.scene.children.filter(c => c.name === 'structure').forEach(wall => {
            const centerToWall = new THREE.Vector3().subVectors(wall.position, this.roomCenter);
            centerToWall.y = 0;
            const wallToCam = new THREE.Vector3().subVectors(this.camera.position, wall.position);
            wallToCam.y = 0;
            centerToWall.normalize();
            wallToCam.normalize();
            const dot = centerToWall.dot(wallToCam);
            if (dot > 0.3) wall.visible = false;
            else wall.visible = true;
        });
        this.renderer.render(this.scene, this.camera);
    }
}

new App();
