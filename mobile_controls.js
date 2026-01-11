import * as THREE from 'three';

export class MobileControls {
    constructor(game) {
        this.game = game;
        this.active = false;

        // Touch tracking
        this.joystickTouchId = null;
        this.lookTouchId = null;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 60; // Max radius for knob
        this.lastLookX = 0;
        this.lastLookY = 0;

        // Elements
        this.container = document.getElementById('mobile-controls');
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickKnob = document.getElementById('joystick-knob');
        this.btnFire = document.getElementById('btn-fire');
        this.btnJump = document.getElementById('btn-jump');

        // Check for mobile
        this.checkMobile();

        if (this.active) {
            this.setupListeners();
            // Force update center
            this.updateJoystickCenter();
        }
    }

    checkMobile() {
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isMobile) {
            this.active = true;
            this.container.classList.remove('hidden');

            // Hide desktop instructions and show crosshair
            const instructions = document.getElementById('instructions');
            if (instructions) instructions.style.display = 'none';

            document.getElementById('crosshair').classList.remove('hidden');

            // Force game controls to think it's locked (so mouseMove works)?
            // Actually controls.onMouseMove checks isLocked.
            // We'll set isLocked manually or bypass it.
            this.game.controls.isLocked = true;
        }
    }

    updateJoystickCenter() {
        if (this.joystickZone) {
            const rect = this.joystickZone.getBoundingClientRect();
            this.joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }
    }

    setupListeners() {
        // Joystick Start
        this.joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystickTouchId = touch.identifier;
            this.updateJoystick(touch.clientX, touch.clientY);
        }, { passive: false });

        // Buttons
        this.btnFire.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.combat.shootProjectile();
            this.btnFire.style.transform = 'scale(0.9)';

            // Auto fire logic? "press left click, keep shooting"
            // We can set isMouseDown=true in game.js logic
            this.game.isMouseDown = true;

        }, { passive: false });

        this.btnFire.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.btnFire.style.transform = 'scale(1)';
            this.game.isMouseDown = false;
        }, { passive: false });

        this.btnJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.game.controls.canJump) {
                this.game.controls.velocity.y = this.game.controls.jumpVelocity;
            }
        }, { passive: false });

        // Global Touch Handlers
        document.addEventListener('touchstart', (e) => this.handleGlobalTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleGlobalTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleGlobalTouchEnd(e), { passive: false });

        window.addEventListener('resize', () => this.updateJoystickCenter());
    }

    handleGlobalTouchStart(e) {
        // Don't prevent default everywhere, or buttons won't work? 
        // We attached listeners to buttons specifically.

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];

            // If NOT joystick touch, and NOT on buttons (simple check: x > half screen?)
            // Or check if target is not joystick/buttons.
            // Simplest for LOOK: Right half of screen.

            if (touch.identifier !== this.joystickTouchId && touch.clientX > window.innerWidth / 2) {
                // Determine if it hit a button
                const target = touch.target;
                if (target === this.btnFire || target === this.btnJump || this.btnFire.contains(target)) {
                    continue;
                }

                // Start Looking
                this.lookTouchId = touch.identifier;
                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;
            }
        }
    }

    handleGlobalTouchMove(e) {
        // Prevent scrolling
        if (e.cancelable) e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];

            if (touch.identifier === this.joystickTouchId) {
                this.updateJoystick(touch.clientX, touch.clientY);
            }
            else if (touch.identifier === this.lookTouchId) {
                const dx = touch.clientX - this.lastLookX;
                const dy = touch.clientY - this.lastLookY;

                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;

                // Apply look
                // multiply by sensitivity factor for mobile (usually needs higher sensitivity)
                const sensitivity = 2.0;

                // Manually call controls logic since onMouseMove expects event
                const controls = this.game.controls;
                controls.euler.setFromQuaternion(controls.camera.quaternion);
                controls.euler.y -= dx * controls.mouseSensitivity * sensitivity;
                controls.euler.x -= dy * controls.mouseSensitivity * sensitivity;
                controls.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, controls.euler.x));
                controls.camera.quaternion.setFromEuler(controls.euler);
            }
        }
    }

    handleGlobalTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === this.joystickTouchId) {
                this.joystickTouchId = null;
                this.joystickKnob.style.transform = `translate(-50%, -50%)`;
                const controls = this.game.controls;
                controls.moveRight = false;
                controls.moveLeft = false;
                controls.moveBackward = false;
                controls.moveForward = false;
            }
            if (touch.identifier === this.lookTouchId) {
                this.lookTouchId = null;
            }
        }
    }

    updateJoystick(clientX, clientY) {
        let dx = clientX - this.joystickCenter.x;
        let dy = clientY - this.joystickCenter.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        // Clamp
        if (distance > this.joystickRadius) {
            const ratio = this.joystickRadius / distance;
            dx *= ratio;
            dy *= ratio;
        }

        this.joystickKnob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;

        const inputX = dx / this.joystickRadius;
        const inputY = dy / this.joystickRadius;
        const deadzone = 0.2;

        const controls = this.game.controls;
        controls.moveRight = inputX > deadzone;
        controls.moveLeft = inputX < -deadzone;
        controls.moveBackward = inputY > deadzone;
        controls.moveForward = inputY < -deadzone;
    }
}
