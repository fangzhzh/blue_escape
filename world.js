import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.blockSize = 1;
        this.worldData = new Map(); // Store blocks as "x,y,z" -> blockType
        this.meshes = new Map(); // Store meshes for each block

        // Block materials
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x5a8f3a }),
            dirt: new THREE.MeshLambertMaterial({ color: 0x8b5a3c }),
            stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
            wood: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
        };

        // Block geometry (shared for performance)
        this.blockGeometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);

        // Generate initial world
        this.generate();
    }

    generate() {
        const size = 50; // 100x100 world
        const maxHeight = 5;

        for (let x = -size; x <= size; x++) {
            for (let z = -size; z <= size; z++) {
                // Create varied terrain with different biomes
                const distanceFromCenter = Math.sqrt(x * x + z * z);
                const isMountainous = distanceFromCenter > 30 && Math.random() < 0.3;

                // Simple height map using sine waves for variation
                let height = Math.floor(
                    3 +
                    Math.sin(x * 0.1) * 2 +
                    Math.cos(z * 0.1) * 2 +
                    Math.sin(x * 0.05 + z * 0.05) * 1
                );

                // Add mountains in outer areas
                if (isMountainous) {
                    height += Math.floor(Math.random() * 3) + 2;
                }

                // Generate layers
                for (let y = 0; y <= height; y++) {
                    let blockType;
                    if (y === height && height > 2) {
                        blockType = 'grass'; // Top layer
                    } else if (y > height - 3 && y < height) {
                        blockType = 'dirt'; // Dirt layer
                    } else {
                        blockType = 'stone'; // Stone layer
                    }

                    this.addBlock(x, y, z, blockType);
                }

                // Add more trees in certain zones (forests)
                const isForest = distanceFromCenter < 20 && Math.abs(x % 10) < 5;
                const treeChance = isForest ? 0.04 : 0.01; // Reduced from 0.08 and 0.02

                if (Math.random() < treeChance && height > 3) {
                    this.createTree(x, height + 1, z);
                }
            }
        }
    }

    createTree(x, y, z) {
        // Tree trunk (wood)
        const trunkHeight = 4;
        for (let i = 0; i < trunkHeight; i++) {
            this.addBlock(x, y + i, z, 'wood');
        }

        // Tree leaves (grass blocks for simplicity)
        const topY = y + trunkHeight;
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue; // Skip corners
                    if (dy === 1 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue; // Smaller top
                    this.addBlock(x + dx, topY + dy, z + dz, 'grass');
                }
            }
        }
    }

    getBlockKey(x, y, z) {
        return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    }

    addBlock(x, y, z, blockType) {
        const key = this.getBlockKey(x, y, z);

        // Don't add if block already exists
        if (this.worldData.has(key)) return;

        // Store block data
        this.worldData.set(key, blockType);

        // Create mesh
        const material = this.materials[blockType] || this.materials.stone;
        const mesh = new THREE.Mesh(this.blockGeometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Store mesh
        this.meshes.set(key, mesh);
        this.scene.add(mesh);
    }

    removeBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);

        // Remove from data
        if (!this.worldData.has(key)) return false;
        this.worldData.delete(key);

        // Remove mesh
        const mesh = this.meshes.get(key);
        if (mesh) {
            this.scene.remove(mesh);
            this.meshes.delete(key);
        }

        return true;
    }

    getBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        return this.worldData.get(key);
    }

    hasBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        return this.worldData.has(key);
    }

    // Check if position collides with any block
    checkCollision(x, y, z, width = 0.6, height = 1.8) {
        // Check all blocks in the player's bounding box
        const halfWidth = width / 2;

        const minX = Math.floor(x - halfWidth);
        const maxX = Math.floor(x + halfWidth);
        const minY = Math.floor(y);
        const maxY = Math.floor(y + height);
        const minZ = Math.floor(z - halfWidth);
        const maxZ = Math.floor(z + halfWidth);

        for (let bx = minX; bx <= maxX; bx++) {
            for (let by = minY; by <= maxY; by++) {
                for (let bz = minZ; bz <= maxZ; bz++) {
                    if (this.hasBlock(bx, by, bz)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
