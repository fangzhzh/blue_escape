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

// Zombie Enemy
export class Zombie extends Entity {
    constructor(scene, position) {
        super(scene, position);
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 3;
        this.attackCooldown = 0;
        this.attackRate = 1.5; // Attack every 1.5 seconds
        this.aggroRange = 15;
        this.attackRange = 3.5; // Increased for easier combat

        // AI State
        this.state = 'idle'; // idle, wander, chase
        this.stateTimer = 0;
        this.patrolCenter = position.clone();
        this.wanderTarget = new THREE.Vector3();
        this.walkSpeed = 1.5;
        this.runSpeed = 3.5;

        this.createMesh();
    }

    createMesh() {
        const group = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x6b8e23 }); // Olive green
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75; // Lowered from 1.5
        group.add(body);

        // Head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 }); // Gray
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75; // Lowered from 2.5
        group.add(head);

        // Eyes (glowing red)
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.75, 0.31);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.75, 0.31);
        group.add(rightEye);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.6, 0.75, 0); // Lowered
        group.add(leftArm);
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.6, 0.75, 0); // Lowered
        group.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.25, -0.3, 0); // Lowered to below body
        group.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.25, -0.3, 0); // Lowered to below body
        group.add(rightLeg);

        group.position.copy(this.position);
        group.scale.set(0.15, 0.15, 0.15); // Scale down to 15% size
        this.mesh = group;
        this.scene.add(this.mesh);
    }

    update(delta, playerPosition) {
        if (!this.alive) return;

        const distanceToPlayer = this.distanceTo(playerPosition);


        // AI Logic
        this.stateTimer -= delta;

        // State Machine
        switch (this.state) {
            case 'idle':
                if (this.stateTimer <= 0) {
                    // Switch to wander
                    this.state = 'wander';
                    this.stateTimer = Math.random() * 3 + 2; // Wander for 2-5 seconds

                    // Pick random target nearby
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 5 + 2;
                    this.wanderTarget.x = this.position.x + Math.cos(angle) * dist;
                    this.wanderTarget.z = this.position.z + Math.sin(angle) * dist;
                    this.wanderTarget.y = this.position.y;
                }

                // Chance to spot player if close
                if (distanceToPlayer < this.aggroRange && Math.random() < 0.02) {
                    this.state = 'chase';
                }
                break;

            case 'wander':
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = Math.random() * 2 + 1; // Idle for 1-3 seconds
                } else {
                    // Move towards target
                    const direction = new THREE.Vector3().subVectors(this.wanderTarget, this.position);
                    direction.y = 0;
                    if (direction.length() > 0.1) {
                        direction.normalize();
                        this.position.add(direction.multiplyScalar(this.walkSpeed * delta));
                        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
                        this.mesh.rotation.x = Math.sin(Date.now() * 0.005) * 0.05; // Slow bob
                    } else {
                        this.state = 'idle'; // Reached target
                    }
                }

                // Chance to spot player
                if (distanceToPlayer < this.aggroRange && Math.random() < 0.05) {
                    this.state = 'chase';
                }
                break;

            case 'chase':
                if (distanceToPlayer > this.aggroRange * 1.5) {
                    // Lost player
                    this.state = 'idle';
                    this.stateTimer = 2;
                } else {
                    // Chase behavior
                    const direction = new THREE.Vector3().subVectors(playerPosition, this.position);
                    direction.y = 0;
                    direction.normalize();

                    this.position.add(direction.multiplyScalar(this.runSpeed * delta));
                    this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
                    this.mesh.rotation.x = Math.sin(Date.now() * 0.01) * 0.1; // Fast bob
                }
                break;
        }

        // Update mesh position
        this.mesh.position.copy(this.position);

        // Attack cooldown
        this.attackCooldown -= delta;
    }

    canAttack() {
        return this.attackCooldown <= 0;
    }

    attack() {
        this.attackCooldown = this.attackRate;
        return 10; // Damage amount
    }

    onDeath() {
        super.onDeath();
    }
}

// Machine Gun Pickup
export class MachineGun extends Entity {
    constructor(scene, position) {
        super(scene, position);
        this.health = Infinity; // Can't be destroyed
        this.rotationSpeed = 1;
        this.bobPhase = 0;

        this.createMesh();
    }

    createMesh() {
        const group = new THREE.Group();

        // Gun barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.75;
        group.add(barrel);

        // Gun body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Magazine
        const magGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.25);
        const magMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const mag = new THREE.Mesh(magGeometry, magMaterial);
        mag.position.set(0, -0.4, 0);
        group.add(mag);

        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.2);
        const stock = new THREE.Mesh(stockGeometry, bodyMaterial);
        stock.position.set(-0.7, 0, 0);
        group.add(stock);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow = glow;
        group.add(glow);

        group.position.copy(this.position);
        group.scale.set(1.5, 1.5, 1.5);
        this.mesh = group;
        this.scene.add(this.mesh);
    }

    update(delta, playerPosition) {
        if (!this.alive) return;

        // Rotate
        this.mesh.rotation.y += delta * this.rotationSpeed;

        // Bob up and down
        this.bobPhase += delta * 2;
        const bobOffset = Math.sin(this.bobPhase) * 0.2;
        this.mesh.position.y = this.position.y + bobOffset;

        // Pulse glow
        if (this.glow) {
            this.glow.material.opacity = 0.3 + Math.sin(this.bobPhase * 2) * 0.2;
        }
    }

    canPickup(playerPosition) {
        return this.distanceTo(playerPosition) < 3.5; // Increased pickup range
    }

    pickup() {
        this.alive = false;
        this.onDeath();
        return true;
    }
}
