import * as THREE from 'three';
import { World } from './world.js';
import { Controls } from './controls.js';
import { FireDragon, FireJellyfish, TreasureBox, Zombie, MachineGun } from './entities.js';
import { CombatSystem } from './combat.js';
import { MobileControls } from './mobile_controls.js';

class Game {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 80, 150);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // World
        this.world = new World(this.scene);

        // Set camera position AFTER world generation
        // Spawn away from center (forests) and high above terrain
        this.camera.position.set(10, 25, 10);

        // Combat System
        this.combat = new CombatSystem(this.scene, this.camera);

        // Controls
        this.controls = new Controls(this.camera, this.renderer.domElement, this.world);

        // Entities
        this.entities = [];
        this.bosses = [];
        this.treasures = [];
        this.zombies = [];
        this.machineGun = null;
        this.spawnEntities();

        // Game state
        this.gameState = 'playing'; // playing, victory, defeat

        // Mouse events
        this.setupMouseEvents();

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // FPS tracking
        this.fps = 60;
        this.lastTime = performance.now();
        this.frames = 0;
        this.fpsUpdateTime = 0;

        // Clock for delta time
        this.clock = new THREE.Clock();

        // Initialize UI
        this.combat.updatePlayerHealthUI();

        // Start animation loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        this.scene.add(dirLight);
    }

    clearSpawnArea() {
        // Clear a safe area around spawn to prevent spawning inside blocks
        const spawnX = 10;
        const spawnZ = 10;
        const radius = 5;

        // Remove all blocks in a cylinder above spawn point
        for (let x = spawnX - radius; x <= spawnX + radius; x++) {
            for (let z = spawnZ - radius; z <= spawnZ + radius; z++) {
                for (let y = 5; y <= 30; y++) {
                    this.world.removeBlock(x, y, z);
                }
            }
        }
    }

    spawnEntities() {
        // Clear spawn area first
        this.clearSpawnArea();

        // Spawn Fire Dragon at one side
        const dragon = new FireDragon(this.scene, new THREE.Vector3(30, 15, 30));
        this.entities.push(dragon);
        this.bosses.push(dragon);

        // Spawn Fire Jellyfish at another side
        const jellyfish = new FireJellyfish(this.scene, new THREE.Vector3(-30, 8, -30));
        this.entities.push(jellyfish);
        this.bosses.push(jellyfish);

        // Spawn treasure boxes near bosses
        const treasure1 = new TreasureBox(this.scene, new THREE.Vector3(35, 5, 35));
        this.entities.push(treasure1);
        this.treasures.push(treasure1);

        const treasure2 = new TreasureBox(this.scene, new THREE.Vector3(-35, 5, -35));
        this.entities.push(treasure2);
        this.treasures.push(treasure2);

        // Spawn machine gun near player spawn
        this.machineGun = new MachineGun(this.scene, new THREE.Vector3(5, 7, 5));
        this.entities.push(this.machineGun);

        // Initial Zombie Spawn (Start with 2)
        this.spawnRandomZombie();
        this.spawnRandomZombie();

        // Setup Mobile Controls
        this.mobileControls = new MobileControls(this);
    }

    spawnRandomZombie() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 25; // 15-40 units away
        const bx = Math.floor(Math.cos(angle) * radius);
        const bz = Math.floor(Math.sin(angle) * radius);

        // Find ground height
        let by = 20;
        while (by > 0 && !this.world.hasBlock(bx, by - 1, bz)) {
            by--;
        }

        // Default to 5 if no ground found (safety)
        if (by === 0) by = 5;

        const spawnPos = new THREE.Vector3(bx + 0.5, by + 1, bz + 0.5);
        const zombie = new Zombie(this.scene, spawnPos);
        this.entities.push(zombie);
        this.zombies.push(zombie);
        console.log(`Spawned zombie at ${bx}, ${by}, ${bz}`);
    }

    setupMouseEvents() {
        this.isMouseDown = false;

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked || this.gameState !== 'playing') return;

            event.preventDefault();

            if (event.button === 0) {
                // Left click - attack
                this.isMouseDown = true;

                // Fire immediately (for single shot or first shot)
                this.combat.shootProjectile();
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Prevent context menu on right click
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateFPS() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.fpsUpdateTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.fpsUpdateTime = currentTime;

            // Update FPS display
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fps}`;

                // Color code based on FPS
                if (this.fps >= 50) {
                    fpsElement.style.color = '#0f0';
                } else if (this.fps >= 30) {
                    fpsElement.style.color = '#ff0';
                } else {
                    fpsElement.style.color = '#f00';
                }
            }
        }
    }

    updateBossStatus() {
        // Update dragon status
        const dragonStatus = document.getElementById('dragon-status');
        if (dragonStatus) {
            const dragon = this.bosses[0];
            if (dragon.alive) {
                dragonStatus.textContent = 'Alive';
                dragonStatus.className = '';
            } else {
                dragonStatus.textContent = 'Defeated';
                dragonStatus.className = 'defeated';
            }
        }

        // Update jellyfish status
        const jellyfishStatus = document.getElementById('jellyfish-status');
        if (jellyfishStatus) {
            const jellyfish = this.bosses[1];
            if (jellyfish.alive) {
                jellyfishStatus.textContent = 'Alive';
                jellyfishStatus.className = '';
            } else {
                jellyfishStatus.textContent = 'Defeated';
                jellyfishStatus.className = 'defeated';
            }
        }
    }

    updateZombieRadar(playerPos) {
        const radarEl = document.getElementById('zombie-radar');
        if (!radarEl || this.zombies.length === 0) {
            if (radarEl) radarEl.textContent = "Searching...";
            return;
        }

        // Find nearest zombie
        let nearest = null;
        let minDist = Infinity;

        this.zombies.forEach(z => {
            if (z.alive) {
                const d = z.distanceTo(playerPos);
                if (d < minDist) {
                    minDist = d;
                    nearest = z;
                }
            }
        });

        if (nearest) {
            // Calculate direction relative to camera
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            // Vector to zombie
            const toZombie = new THREE.Vector3().subVectors(nearest.position, playerPos);
            toZombie.y = 0;
            toZombie.normalize();

            const dot = forward.dot(toZombie);
            const cross = new THREE.Vector3().crossVectors(forward, toZombie);

            let dir = "";
            if (dot > 0.707) dir = "Ahead ⬆️"; // 45 degrees
            else if (dot < -0.707) dir = "Behind ⬇️";
            else if (cross.y > 0) dir = "Left ⬅️"; // Left is positive Cross Y
            else dir = "Right ➡️";

            radarEl.textContent = `${Math.round(minDist)}m ${dir}`;

            // Color code distance
            if (minDist < 15) radarEl.style.color = "#ff0000"; // Red (Danger)
            else if (minDist < 40) radarEl.style.color = "#ffa500"; // Orange
            else radarEl.style.color = "#00ff00"; // Green (Safe)
        }
    }

    checkVictory() {
        // Check if all bosses are defeated
        const allBossesDefeated = this.bosses.every(boss => !boss.alive);

        if (allBossesDefeated && this.gameState === 'playing') {
            this.gameState = 'victory';

            // Unlock treasures
            this.treasures.forEach(treasure => treasure.unlock());

            // Show victory screen
            document.getElementById('victory').classList.remove('hidden');
            document.getElementById('objective').classList.add('hidden');
            document.getElementById('player-health').classList.add('hidden');
            document.exitPointerLock();
        }
    }

    checkDefeat() {
        if (!this.combat.isPlayerAlive() && this.gameState === 'playing') {
            this.gameState = 'defeat';

            // Show death screen
            document.getElementById('death').classList.remove('hidden');
            document.getElementById('objective').classList.add('hidden');
            document.getElementById('player-health').classList.add('hidden');
            document.exitPointerLock();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        if (this.gameState === 'playing') {
            // Update controls
            this.controls.update(delta);

            // Update entities
            const playerPos = this.camera.position;
            this.entities.forEach(entity => {
                entity.update(delta, playerPos);
            });

            // Update combat
            this.combat.update(delta);

            // Auto-fire for machine gun
            if (this.isMouseDown && this.combat.hasMachineGun) {
                this.combat.shootProjectile();
            }

            // Check machine gun pickup
            if (this.machineGun && this.machineGun.alive && this.machineGun.canPickup(playerPos)) {
                this.combat.pickupMachineGun();
                this.machineGun.pickup();
                // Remove from entities array
                const index = this.entities.indexOf(this.machineGun);
                if (index > -1) {
                    this.entities.splice(index, 1);
                }
                this.machineGun = null;
            }

            // Check projectile hits on all enemies (bosses + zombies)
            const allEnemies = [...this.bosses, ...this.zombies];
            this.combat.checkProjectileHits(allEnemies);

            // Manage Zombies (Cleanup dead & Respawn)
            for (let i = this.zombies.length - 1; i >= 0; i--) {
                if (!this.zombies[i].alive) {
                    // Remove from entities
                    const idx = this.entities.indexOf(this.zombies[i]);
                    if (idx > -1) this.entities.splice(idx, 1);
                    this.zombies.splice(i, 1);
                }
            }

            // Maintain 2 zombies (respawn if killed)
            if (this.zombies.length < 2) {
                this.spawnRandomZombie();
            }

            if (this.zombies.length < 2) {
                this.spawnRandomZombie();
            }

            // Update boss status UI
            this.updateBossStatus();

            // Update Zombie Radar
            this.updateZombieRadar(playerPos);

            // Check win/lose conditions
            this.checkVictory();
            this.checkDefeat();
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);

        // Update FPS
        this.updateFPS();
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
