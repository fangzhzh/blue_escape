import * as THREE from 'three';

export class Controls {
    constructor(camera, domElement, world) {
        this.camera = camera;
        this.domElement = domElement;
        this.world = world;

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        // Physics
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Player settings
        this.speed = 5.0;
        this.jumpVelocity = 8.0;
        this.gravity = 20.0;
        this.playerHeight = 1.8;
        this.playerWidth = 0.6;

        // Mouse sensitivity
        this.mouseSensitivity = 0.002;

        // Camera rotation
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isLocked = false;

        // Bind event handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onPointerLockError = this.onPointerLockError.bind(this);

        // Setup controls
        this.setupPointerLock();
        this.setupKeyboard();
    }

    setupPointerLock() {
        // Pointer lock for mouse control
        this.domElement.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        document.addEventListener('pointerlockerror', this.onPointerLockError);
        document.addEventListener('mousemove', this.onMouseMove);
    }

    setupKeyboard() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    onPointerLockChange() {
        if (document.pointerLockElement === this.domElement) {
            this.isLocked = true;
            document.getElementById('instructions').classList.add('hidden');
            document.getElementById('crosshair').classList.remove('hidden');
            document.body.classList.add('locked');
        } else {
            this.isLocked = false;
            document.getElementById('instructions').classList.remove('hidden');
            document.getElementById('crosshair').classList.add('hidden');
            document.body.classList.remove('locked');
        }
    }

    onPointerLockError() {
        console.error('Pointer lock error');
    }

    onMouseMove(event) {
        if (!this.isLocked) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * this.mouseSensitivity;
        this.euler.x -= movementY * this.mouseSensitivity;

        // Limit vertical rotation
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.camera.quaternion.setFromEuler(this.euler);
    }

    onKeyDown(event) {
        console.log('Key pressed:', event.code, 'isLocked:', this.isLocked);
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) {
                    this.velocity.y = this.jumpVelocity;
                }
                break;
            case 'Escape':
                document.exitPointerLock();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update(delta) {
        // Movement works regardless of mouse lock

        // Apply gravity
        this.velocity.y -= this.gravity * delta;

        // Get movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        // Calculate new velocity based on input
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        const moveDirection = new THREE.Vector3();
        moveDirection.addScaledVector(forward, this.direction.z);
        moveDirection.addScaledVector(right, this.direction.x);

        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }

        // Apply horizontal movement
        const horizontalVelocity = moveDirection.multiplyScalar(this.speed);

        // Calculate new position
        const newPosition = this.camera.position.clone();
        newPosition.x += horizontalVelocity.x * delta;
        newPosition.z += horizontalVelocity.z * delta;
        newPosition.y += this.velocity.y * delta;

        // Collision detection
        // Check horizontal collision
        if (!this.world.checkCollision(newPosition.x, this.camera.position.y, this.camera.position.z, this.playerWidth, this.playerHeight)) {
            this.camera.position.x = newPosition.x;
        }

        if (!this.world.checkCollision(this.camera.position.x, this.camera.position.y, newPosition.z, this.playerWidth, this.playerHeight)) {
            this.camera.position.z = newPosition.z;
        }

        // Check vertical collision
        if (!this.world.checkCollision(this.camera.position.x, newPosition.y, this.camera.position.z, this.playerWidth, this.playerHeight)) {
            this.camera.position.y = newPosition.y;
            this.canJump = false;
        } else {
            // We hit something
            if (this.velocity.y < 0) {
                // We hit the ground
                this.canJump = true;
                // Snap to ground level
                const groundY = Math.floor(this.camera.position.y);
                this.camera.position.y = groundY;
            }
            this.velocity.y = 0;
        }
    }

    dispose() {
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('pointerlockerror', this.onPointerLockError);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
}
