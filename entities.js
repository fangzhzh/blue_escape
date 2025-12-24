import * as THREE from 'three';

// Base Entity class
export class Entity {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.health = 100;
        this.maxHealth = 100;
        this.mesh = null;
        this.healthBar = null;
        this.alive = true;
    }

    update(delta, playerPosition) {
        // Override in subclasses
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this.onDeath();
        }
        this.updateHealthBar();
    }

    onDeath() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.healthBar) {
            this.scene.remove(this.healthBar);
        }
    }

    updateHealthBar() {
        // Override in subclasses with visible health bars
    }

    distanceTo(position) {
        return this.position.distanceTo(position);
    }
}

// Fire Dragon Boss
export class FireDragon extends Entity {
    constructor(scene, position) {
        super(scene, position);
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 3;
        this.attackCooldown = 0;
        this.attackRate = 2; // Attack every 2 seconds
        this.patrolCenter = position.clone();
        this.patrolRadius = 15;
        this.patrolAngle = 0;
        this.isAggressive = false;
        this.aggroRange = 20;
        this.fireballs = [];

        this.createMesh();
        this.createHealthBar();
    }

    createMesh() {
        // Create dragon body
        const group = new THREE.Group();

        // Body (elongated)
        const bodyGeometry = new THREE.CapsuleGeometry(1, 3, 8, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2;
        group.add(body);

        // Head
        const headGeometry = new THREE.ConeGeometry(1.2, 2, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.rotation.z = -Math.PI / 2;
        head.position.set(2.5, 0, 0);
        group.add(head);

        // Wings
        const wingGeometry = new THREE.BoxGeometry(0.2, 3, 2);
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(0, 2, 0);
        group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0, -2, 0);
        group.add(rightWing);

        // Tail
        const tailGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.rotation.z = Math.PI / 2;
        tail.position.set(-2.5, 0, 0);
        group.add(tail);

        group.position.copy(this.position);
        this.mesh = group;
        this.scene.add(this.mesh);
    }

    createHealthBar() {
        // Health bar background
        const barWidth = 3;
        const barHeight = 0.3;
        const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const barBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const barBg = new THREE.Mesh(barGeometry, barBgMaterial);

        // Health bar fill
        const barFillMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const barFill = new THREE.Mesh(barGeometry, barFillMaterial);
        barFill.position.z = 0.01;

        const barGroup = new THREE.Group();
        barGroup.add(barBg);
        barGroup.add(barFill);

        this.healthBar = barGroup;
        this.healthBarFill = barFill;
        this.scene.add(this.healthBar);
    }

    update(delta, playerPosition) {
        if (!this.alive) return;

        const distanceToPlayer = this.distanceTo(playerPosition);

        // Check aggro
        if (distanceToPlayer < this.aggroRange) {
            this.isAggressive = true;
        }

        if (this.isAggressive) {
            // Chase player
            const direction = new THREE.Vector3();
            direction.subVectors(playerPosition, this.position);
            direction.y = 0;
            direction.normalize();

            this.position.add(direction.multiplyScalar(this.speed * delta));
            this.position.y = playerPosition.y + 5; // Fly above player

            // Face player
            this.mesh.lookAt(playerPosition);
        } else {
            // Patrol in circles
            this.patrolAngle += delta * 0.5;
            this.position.x = this.patrolCenter.x + Math.cos(this.patrolAngle) * this.patrolRadius;
            this.position.z = this.patrolCenter.z + Math.sin(this.patrolAngle) * this.patrolRadius;
            this.position.y = this.patrolCenter.y + 8 + Math.sin(this.patrolAngle * 2) * 2;
        }

        // Update mesh position
        this.mesh.position.copy(this.position);

        // Update health bar
        this.healthBar.position.copy(this.position);
        this.healthBar.position.y += 3;

        // Attack
        this.attackCooldown -= delta;
        if (this.isAggressive && this.attackCooldown <= 0 && distanceToPlayer < 15) {
            this.shootFireball(playerPosition);
            this.attackCooldown = this.attackRate;
        }

        // Update fireballs
        this.fireballs = this.fireballs.filter(fireball => {
            fireball.position.add(fireball.velocity.clone().multiplyScalar(delta));
            fireball.mesh.position.copy(fireball.position);

            // Remove if too far
            if (fireball.position.distanceTo(this.position) > 30) {
                this.scene.remove(fireball.mesh);
                return false;
            }
            return true;
        });
    }

    shootFireball(targetPosition) {
        const direction = new THREE.Vector3();
        direction.subVectors(targetPosition, this.position);
        direction.normalize();

        const fireballGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const fireballMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500, emissive: 0xff4500 });
        const fireballMesh = new THREE.Mesh(fireballGeometry, fireballMaterial);
        fireballMesh.position.copy(this.position);

        this.scene.add(fireballMesh);

        this.fireballs.push({
            mesh: fireballMesh,
            position: this.position.clone(),
            velocity: direction.multiplyScalar(10),
            damage: 20
        });
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBarFill.scale.x = healthPercent;
        this.healthBarFill.position.x = -1.5 * (1 - healthPercent);
    }
}

// Fire Jellyfish Boss
export class FireJellyfish extends Entity {
    constructor(scene, position) {
        super(scene, position);
        this.health = 200;
        this.maxHealth = 200;
        this.speed = 2;
        this.attackCooldown = 0;
        this.attackRate = 3; // Attack every 3 seconds
        this.patrolCenter = position.clone();
        this.bouncePhase = 0;
        this.isAggressive = false;
        this.aggroRange = 15;

        this.createMesh();
        this.createHealthBar();
    }

    createMesh() {
        const group = new THREE.Group();

        // Jellyfish dome
        const domeGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshLambertMaterial({
            color: 0xff1493,
            transparent: true,
            opacity: 0.8
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        group.add(dome);

        // Tentacles
        const tentacleGeometry = new THREE.CylinderGeometry(0.1, 0.05, 2, 8);
        const tentacleMaterial = new THREE.MeshLambertMaterial({ color: 0xff69b4 });

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
            tentacle.position.x = Math.cos(angle) * 0.8;
            tentacle.position.z = Math.sin(angle) * 0.8;
            tentacle.position.y = -1;
            group.add(tentacle);
        }

        // Glow
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.5;
        group.add(glow);

        group.position.copy(this.position);
        this.mesh = group;
        this.scene.add(this.mesh);
    }

    createHealthBar() {
        const barWidth = 3;
        const barHeight = 0.3;
        const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const barBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const barBg = new THREE.Mesh(barGeometry, barBgMaterial);

        const barFillMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const barFill = new THREE.Mesh(barGeometry, barFillMaterial);
        barFill.position.z = 0.01;

        const barGroup = new THREE.Group();
        barGroup.add(barBg);
        barGroup.add(barFill);

        this.healthBar = barGroup;
        this.healthBarFill = barFill;
        this.scene.add(this.healthBar);
    }

    update(delta, playerPosition) {
        if (!this.alive) return;

        const distanceToPlayer = this.distanceTo(playerPosition);

        // Check aggro
        if (distanceToPlayer < this.aggroRange) {
            this.isAggressive = true;
        }

        // Bounce motion
        this.bouncePhase += delta * 3;
        const bounce = Math.sin(this.bouncePhase) * 0.5;

        if (this.isAggressive) {
            // Move toward player (slowly)
            const direction = new THREE.Vector3();
            direction.subVectors(playerPosition, this.position);
            direction.y = 0;
            direction.normalize();

            this.position.add(direction.multiplyScalar(this.speed * delta));
        }

        this.position.y = this.patrolCenter.y + 3 + bounce;

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y += delta;

        // Update health bar
        this.healthBar.position.copy(this.position);
        this.healthBar.position.y += 3;

        // Attack
        this.attackCooldown -= delta;
        if (this.isAggressive && this.attackCooldown <= 0 && distanceToPlayer < 8) {
            this.electricShock();
            this.attackCooldown = this.attackRate;
        }
    }

    electricShock() {
        // Create visual shock effect (handled by combat system)
        this.lastShockTime = Date.now();
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBarFill.scale.x = healthPercent;
        this.healthBarFill.position.x = -1.5 * (1 - healthPercent);
    }
}

// Treasure Box
export class TreasureBox extends Entity {
    constructor(scene, position) {
        super(scene, position);
        this.health = Infinity; // Can't be destroyed
        this.opened = false;
        this.locked = true;

        this.createMesh();
    }

    createMesh() {
        const group = new THREE.Group();

        // Box base
        const baseGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        group.add(base);

        // Box lid
        const lidGeometry = new THREE.BoxGeometry(1.6, 0.3, 1.6);
        const lid = new THREE.Mesh(lidGeometry, baseMaterial);
        lid.position.y = 1.15;
        group.add(lid);
        this.lid = lid;

        // Gold trim
        const trimGeometry = new THREE.BoxGeometry(1.7, 0.1, 1.7);
        const trimMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        const trim = new THREE.Mesh(trimGeometry, trimMaterial);
        trim.position.y = 1.05;
        group.add(trim);

        // Lock (if locked)
        if (this.locked) {
            const lockGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
            const lockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const lock = new THREE.Mesh(lockGeometry, lockMaterial);
            lock.position.set(0, 0.5, 0.76);
            group.add(lock);
            this.lockMesh = lock;
        }

        group.position.copy(this.position);
        this.mesh = group;
        this.scene.add(this.mesh);
    }

    unlock() {
        this.locked = false;
        if (this.lockMesh) {
            this.mesh.remove(this.lockMesh);
        }
    }

    open() {
        if (this.locked || this.opened) return false;

        this.opened = true;
        // Animate lid opening
        this.lid.rotation.x = Math.PI / 3;
        this.lid.position.z -= 0.3;
        this.lid.position.y += 0.2;

        return true;
    }
}
