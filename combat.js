import * as THREE from 'three';

export class CombatSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.playerHealth = 100;
        this.maxPlayerHealth = 100;
        this.attackCooldown = 0;
        this.attackRate = 0.5; // Attack every 0.5 seconds
        this.projectiles = [];
        this.damageNumbers = [];
        this.particleEffects = [];

        // Player attack stats
        this.attackDamage = 25;
        this.attackRange = 30;
        this.projectileSpeed = 20;
    }

    update(delta) {
        // Update cooldowns
        this.attackCooldown = Math.max(0, this.attackCooldown - delta);

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.position.add(proj.velocity.clone().multiplyScalar(delta));
            proj.mesh.position.copy(proj.position);

            // Remove if too far
            if (proj.position.distanceTo(this.camera.position) > this.attackRange * 2) {
                this.scene.remove(proj.mesh);
                return false;
            }
            return true;
        });

        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(dmg => {
            dmg.lifetime -= delta;
            dmg.position.y += delta * 2;
            dmg.mesh.position.copy(dmg.position);
            dmg.mesh.material.opacity = dmg.lifetime / 1.5;

            if (dmg.lifetime <= 0) {
                this.scene.remove(dmg.mesh);
                return false;
            }
            return true;
        });

        // Update particle effects
        this.particleEffects = this.particleEffects.filter(effect => {
            effect.lifetime -= delta;
            effect.mesh.scale.multiplyScalar(1 + delta * 2);
            effect.mesh.material.opacity = effect.lifetime / 0.5;

            if (effect.lifetime <= 0) {
                this.scene.remove(effect.mesh);
                return false;
            }
            return true;
        });
    }

    canAttack() {
        return this.attackCooldown <= 0;
    }

    shootProjectile() {
        if (!this.canAttack()) return null;

        this.attackCooldown = this.attackRate;

        // Get camera direction
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.normalize();

        // Create projectile
        const projGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const projMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff
        });
        const projMesh = new THREE.Mesh(projGeometry, projMaterial);

        const startPos = this.camera.position.clone();
        startPos.add(direction.clone().multiplyScalar(2));
        projMesh.position.copy(startPos);

        this.scene.add(projMesh);

        const projectile = {
            mesh: projMesh,
            position: startPos.clone(),
            velocity: direction.multiplyScalar(this.projectileSpeed),
            damage: this.attackDamage
        };

        this.projectiles.push(projectile);
        return projectile;
    }

    checkProjectileHits(entities) {
        const hits = [];

        this.projectiles = this.projectiles.filter(proj => {
            for (const entity of entities) {
                if (!entity.alive) continue;

                const distance = proj.position.distanceTo(entity.position);
                if (distance < 2) {
                    // Hit!
                    entity.takeDamage(proj.damage);
                    this.createDamageNumber(entity.position, proj.damage);
                    this.createHitEffect(proj.position);
                    this.scene.remove(proj.mesh);
                    hits.push({ entity, damage: proj.damage });
                    return false;
                }
            }
            return true;
        });

        return hits;
    }

    checkMonsterAttacks(monsters, playerPosition) {
        for (const monster of monsters) {
            if (!monster.alive) continue;

            // Check dragon fireballs
            if (monster.fireballs) {
                monster.fireballs = monster.fireballs.filter(fireball => {
                    const distance = fireball.position.distanceTo(playerPosition);
                    if (distance < 1) {
                        // Hit player!
                        this.damagePlayer(fireball.damage);
                        this.createHitEffect(fireball.position, 0xff4500);
                        this.scene.remove(fireball.mesh);
                        return false;
                    }
                    return true;
                });
            }

            // Check jellyfish electric shock
            if (monster.lastShockTime && Date.now() - monster.lastShockTime < 100) {
                const distance = monster.position.distanceTo(playerPosition);
                if (distance < 8) {
                    this.damagePlayer(15);
                    this.createElectricEffect(playerPosition);
                    monster.lastShockTime = 0; // Prevent multiple hits
                }
            }
        }
    }

    damagePlayer(amount) {
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        this.updatePlayerHealthUI();
    }

    healPlayer(amount) {
        this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + amount);
        this.updatePlayerHealthUI();
    }

    isPlayerAlive() {
        return this.playerHealth > 0;
    }

    resetPlayer() {
        this.playerHealth = this.maxPlayerHealth;
        this.updatePlayerHealthUI();
    }

    updatePlayerHealthUI() {
        const healthBar = document.getElementById('player-health-fill');
        if (healthBar) {
            const healthPercent = (this.playerHealth / this.maxPlayerHealth) * 100;
            healthBar.style.width = healthPercent + '%';

            // Color based on health
            if (healthPercent > 60) {
                healthBar.style.background = 'linear-gradient(90deg, #00ff00, #00cc00)';
            } else if (healthPercent > 30) {
                healthBar.style.background = 'linear-gradient(90deg, #ffff00, #ffcc00)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #ff0000, #cc0000)';
            }
        }

        const healthText = document.getElementById('player-health-text');
        if (healthText) {
            healthText.textContent = `${Math.ceil(this.playerHealth)} / ${this.maxPlayerHealth}`;
        }
    }

    createDamageNumber(position, damage) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(damage.toString(), 64, 48);
        ctx.fillText(damage.toString(), 64, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 1, 1);
        sprite.position.copy(position);
        sprite.position.y += 2;

        this.scene.add(sprite);

        this.damageNumbers.push({
            mesh: sprite,
            position: position.clone(),
            lifetime: 1.5
        });
    }

    createHitEffect(position, color = 0xffffff) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        this.scene.add(mesh);

        this.particleEffects.push({
            mesh: mesh,
            lifetime: 0.5
        });
    }

    createElectricEffect(position) {
        // Create multiple lightning particles
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.BoxGeometry(0.1, Math.random() + 0.5, 0.1);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.position.x += (Math.random() - 0.5) * 2;
            mesh.position.z += (Math.random() - 0.5) * 2;
            mesh.position.y += Math.random();
            mesh.rotation.z = (Math.random() - 0.5) * 0.5;

            this.scene.add(mesh);

            this.particleEffects.push({
                mesh: mesh,
                lifetime: 0.3
            });
        }
    }
}
