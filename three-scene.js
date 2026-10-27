/**
 * ==========================================================================
 * ODAKUTO Portfolio — Procedural Three.js Engine
 * Inspired by img2threejs (Code-only, procedural, token/bandwidth efficient)
 * ==========================================================================
 */

(function () {
    'use strict';

    // WebGL support check
    const hasWebGL = () => {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    };

    if (!hasWebGL() || typeof THREE === 'undefined') {
        console.warn('Three.js or WebGL not available. Falling back to static mode.');
        return;
    }

    // ==========================================================================
    // 1. HERO AMBIENT 3D NETWORK (NITKC Electronics & Technology Theme)
    // ==========================================================================
    const initHeroBackground = () => {
        const container = document.getElementById('hero-canvas-container');
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 24;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Procedural particle / node constellation
        const particleCount = 55;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        const spreadX = 36;
        const spreadY = 22;
        const spreadZ = 12;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spreadX;
            positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;

            velocities.push({
                x: (Math.random() - 0.5) * 0.008,
                y: (Math.random() - 0.5) * 0.008,
                z: (Math.random() - 0.5) * 0.004
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create round dot texture procedurally with 2D Canvas (no external image download)
        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = 32;
        dotCanvas.height = 32;
        const ctx = dotCanvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#111111';
        ctx.fill();
        const dotTexture = new THREE.CanvasTexture(dotCanvas);

        const pointMaterial = new THREE.PointsMaterial({
            size: 0.38,
            map: dotTexture,
            transparent: true,
            opacity: 0.28,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, pointMaterial);
        scene.add(points);

        // Lines connecting close nodes (Constellation / Circuit effect)
        const lineMaxConnections = 120;
        const linePositions = new Float32Array(lineMaxConnections * 6);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.12,
            depthWrite: false
        });

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);

        // Mouse Parallax
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        // IntersectionObserver for performance (sleep rendering when not in view)
        let isVisible = true;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
            });
        }, { threshold: 0.05 });
        observer.observe(container);

        // Resize handler
        window.addEventListener('resize', () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            if (!isVisible) return;

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            camera.position.x = targetX * 1.5;
            camera.position.y = -targetY * 1.2;
            camera.lookAt(0, 0, 0);

            const posArray = points.geometry.attributes.position.array;
            let lineIdx = 0;
            const maxDist = 7.5;

            for (let i = 0; i < particleCount; i++) {
                posArray[i * 3] += velocities[i].x;
                posArray[i * 3 + 1] += velocities[i].y;
                posArray[i * 3 + 2] += velocities[i].z;

                if (Math.abs(posArray[i * 3]) > spreadX / 2) velocities[i].x *= -1;
                if (Math.abs(posArray[i * 3 + 1]) > spreadY / 2) velocities[i].y *= -1;
                if (Math.abs(posArray[i * 3 + 2]) > spreadZ / 2) velocities[i].z *= -1;

                // Find neighbor connections
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = posArray[i * 3] - posArray[j * 3];
                    const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                    const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < maxDist && lineIdx < lineMaxConnections) {
                        linePositions[lineIdx * 6] = posArray[i * 3];
                        linePositions[lineIdx * 6 + 1] = posArray[i * 3 + 1];
                        linePositions[lineIdx * 6 + 2] = posArray[i * 3 + 2];
                        linePositions[lineIdx * 6 + 3] = posArray[j * 3];
                        linePositions[lineIdx * 6 + 4] = posArray[j * 3 + 1];
                        linePositions[lineIdx * 6 + 5] = posArray[j * 3 + 2];
                        lineIdx++;
                    }
                }
            }

            points.geometry.attributes.position.needsUpdate = true;
            lines.geometry.setDrawRange(0, lineIdx * 2);
            lines.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        };

        animate();
    };

    // ==========================================================================
    // 2. VISION PROCEDURAL 3D PAVILION (Next-Gen Theme Park Concept in Three.js)
    // ==========================================================================
    const initVision3D = () => {
        const container = document.getElementById('vision-3d-stage');
        if (!container) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0c16, 0.025);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 3.2, 11);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Group container for the entire pavilion
        const pavilionGroup = new THREE.Group();
        scene.add(pavilionGroup);

        // ----- Procedural Architecture (img2threejs code-only reconstruction) -----

        // 1. Crystal Spires Materials
        const crystalMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x6ee7f7,
            emissive: 0x083344,
            roughness: 0.1,
            metalness: 0.2,
            transmission: 0.65,
            ior: 1.5,
            thickness: 0.8,
            transparent: true,
            opacity: 0.88,
            wireframe: false
        });

        const goldAccentMaterial = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0x78350f,
            roughness: 0.25,
            metalness: 0.85
        });

        const darkStructureMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e1b4b,
            roughness: 0.35,
            metalness: 0.7
        });

        const neonGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true
        });

        // 2. Center Majestic Spire
        const centerSpireGeo = new THREE.ConeGeometry(0.85, 4.2, 7);
        const centerSpire = new THREE.Mesh(centerSpireGeo, crystalMaterial);
        centerSpire.position.y = 2.4;
        pavilionGroup.add(centerSpire);

        // Spire inner glowing core
        const coreGeo = new THREE.OctahedronGeometry(0.5, 0);
        const coreMesh = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        coreMesh.position.y = 2.4;
        pavilionGroup.add(coreMesh);

        // Top finial star
        const starGeo = new THREE.OctahedronGeometry(0.28, 0);
        const starMesh = new THREE.Mesh(starGeo, goldAccentMaterial);
        starMesh.position.y = 4.6;
        pavilionGroup.add(starMesh);

        // 3. Surrounding Spires (Turrets)
        const turretCount = 5;
        const turretRadius = 1.8;
        for (let i = 0; i < turretCount; i++) {
            const angle = (i / turretCount) * Math.PI * 2;
            const x = Math.cos(angle) * turretRadius;
            const z = Math.sin(angle) * turretRadius;

            // Turret Base
            const baseGeo = new THREE.CylinderGeometry(0.28, 0.38, 2.0, 6);
            const turretBase = new THREE.Mesh(baseGeo, darkStructureMaterial);
            turretBase.position.set(x, 1.0, z);
            pavilionGroup.add(turretBase);

            // Turret Roof
            const roofGeo = new THREE.ConeGeometry(0.38, 1.8, 6);
            const turretRoof = new THREE.Mesh(roofGeo, crystalMaterial);
            turretRoof.position.set(x, 2.7, z);
            pavilionGroup.add(turretRoof);

            // Turret Golden Band
            const bandGeo = new THREE.TorusGeometry(0.32, 0.04, 8, 16);
            const bandMesh = new THREE.Mesh(bandGeo, goldAccentMaterial);
            bandMesh.rotation.x = Math.PI / 2;
            bandMesh.position.set(x, 1.9, z);
            pavilionGroup.add(bandMesh);
        }

        // 4. Multi-level Floating Kinetic Orbit Rings (Rollercoaster Loop Concept)
        const orbitCurve1 = new THREE.TorusGeometry(2.8, 0.06, 12, 64);
        const orbitRing1 = new THREE.Mesh(orbitCurve1, neonGlowMaterial);
        orbitRing1.rotation.x = Math.PI * 0.42;
        orbitRing1.rotation.y = Math.PI * 0.15;
        orbitRing1.position.y = 2.2;
        pavilionGroup.add(orbitRing1);

        const orbitCurve2 = new THREE.TorusGeometry(3.6, 0.04, 12, 64);
        const orbitRing2 = new THREE.Mesh(orbitCurve2, new THREE.MeshBasicMaterial({ color: 0xf43f5e, wireframe: true }));
        orbitRing2.rotation.x = -Math.PI * 0.35;
        orbitRing2.rotation.z = Math.PI * 0.25;
        orbitRing2.position.y = 2.6;
        pavilionGroup.add(orbitRing2);

        // 5. Stepped Ground Amphitheater
        const podium1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.3, 16), darkStructureMaterial);
        podium1.position.y = 0.15;
        pavilionGroup.add(podium1);

        const podium2 = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.6, 0.2, 24), darkStructureMaterial);
        podium2.position.y = -0.1;
        pavilionGroup.add(podium2);

        // 6. Magic Dust / Floating Stardust Particle System
        const starDustCount = 220;
        const starDustGeo = new THREE.BufferGeometry();
        const starDustPos = new Float32Array(starDustCount * 3);
        const starDustAngles = [];
        const starDustSpeeds = [];

        for (let i = 0; i < starDustCount; i++) {
            const rad = 0.8 + Math.random() * 3.8;
            const angle = Math.random() * Math.PI * 2;
            const y = Math.random() * 5.0;

            starDustPos[i * 3] = Math.cos(angle) * rad;
            starDustPos[i * 3 + 1] = y;
            starDustPos[i * 3 + 2] = Math.sin(angle) * rad;

            starDustAngles.push({ rad, angle, y, initialY: y });
            starDustSpeeds.push(0.005 + Math.random() * 0.012);
        }

        starDustGeo.setAttribute('position', new THREE.BufferAttribute(starDustPos, 3));

        const starDustMat = new THREE.PointsMaterial({
            size: 0.14,
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });

        const starDustPoints = new THREE.Points(starDustGeo, starDustMat);
        pavilionGroup.add(starDustPoints);

        // 7. Lighting System
        const ambientLight = new THREE.AmbientLight(0x0f172a, 2.0);
        scene.add(ambientLight);

        const mainDirLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
        mainDirLight.position.set(5, 10, 7);
        scene.add(mainDirLight);

        const goldLight = new THREE.PointLight(0xfbbf24, 2.5, 12);
        goldLight.position.set(-3, 3, 3);
        scene.add(goldLight);

        const cyanLight = new THREE.PointLight(0x06b6d4, 3.0, 14);
        cyanLight.position.set(3, 4, -2);
        scene.add(cyanLight);

        // ----- Interactive Controls (Orbit on drag, damping, auto-spin) -----
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotationVelocity = { x: 0, y: 0.003 };

        const onPointerDown = (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX || (e.touches && e.touches[0].clientX) || 0, y: e.clientY || (e.touches && e.touches[0].clientY) || 0 };
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (clientX === undefined) return;

            const deltaX = clientX - previousMousePosition.x;
            const deltaY = clientY - previousMousePosition.y;

            rotationVelocity.y = deltaX * 0.005;
            rotationVelocity.x = deltaY * 0.005;

            previousMousePosition = { x: clientX, y: clientY };
        };

        const onPointerUp = () => {
            isDragging = false;
        };

        container.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove, { passive: true });
        window.addEventListener('mouseup', onPointerUp);

        container.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        // IntersectionObserver for CPU/GPU efficiency
        let isVisionVisible = false;
        const visionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisionVisible = entry.isIntersecting;
            });
        }, { threshold: 0.1 });
        visionObserver.observe(container);

        // Resize
        window.addEventListener('resize', () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });

        // Animation Loop
        let clock = new THREE.Clock();

        const animateVision = () => {
            requestAnimationFrame(animateVision);
            if (!isVisionVisible) return;

            const elapsedTime = clock.getElapsedTime();

            // Smooth damping rotation
            if (!isDragging) {
                rotationVelocity.y += (0.003 - rotationVelocity.y) * 0.04;
                rotationVelocity.x += (0 - rotationVelocity.x) * 0.05;
            }

            pavilionGroup.rotation.y += rotationVelocity.y;
            pavilionGroup.rotation.x = Math.max(-0.35, Math.min(0.45, pavilionGroup.rotation.x + rotationVelocity.x));

            // Dynamic kinetic elements
            orbitRing1.rotation.z += 0.008;
            orbitRing2.rotation.z -= 0.006;
            coreMesh.rotation.y += 0.02;
            starMesh.rotation.y -= 0.03;
            starMesh.position.y = 4.6 + Math.sin(elapsedTime * 2.5) * 0.08;

            // Swirl Stardust Particles
            const sPos = starDustPoints.geometry.attributes.position.array;
            for (let i = 0; i < starDustCount; i++) {
                const s = starDustAngles[i];
                s.angle += starDustSpeeds[i];
                s.y = s.initialY + Math.sin(elapsedTime * 1.5 + i) * 0.35;

                sPos[i * 3] = Math.cos(s.angle) * s.rad;
                sPos[i * 3 + 1] = s.y;
                sPos[i * 3 + 2] = Math.sin(s.angle) * s.rad;
            }
            starDustPoints.geometry.attributes.position.needsUpdate = true;

            // Pulse point lights
            goldLight.intensity = 2.2 + Math.sin(elapsedTime * 2.0) * 0.6;
            cyanLight.intensity = 2.8 + Math.cos(elapsedTime * 2.4) * 0.8;

            renderer.render(scene, camera);
        };

        animateVision();
    };

    // ==========================================================================
    // 3. PROJECTS: 3D INTERACTIVE BUSINESS CARD (Kosen Formal & Entre Club Casual)
    // ==========================================================================
    const initBusinessCard3D = () => {
        const container = document.getElementById('card-3d-stage');
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 5.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // Card Dimensions (Japanese Standard Meishi: 91mm x 55mm = ~1.65:1)
        const cardWidth = 3.3;
        const cardHeight = 2.0;
        const cardThickness = 0.025;

        // ----- Procedural Textures using HTML5 Canvas (Crisp Retina resolution) -----

        // 1. Front Texture (Formal Kushiro Kosen)
        const frontCanvas = document.createElement('canvas');
        frontCanvas.width = 1024;
        frontCanvas.height = 620;
        const fCtx = frontCanvas.getContext('2d');

        // Background
        fCtx.fillStyle = '#FFFFFF';
        fCtx.fillRect(0, 0, 1024, 620);

        // Gold Star Emblem
        fCtx.fillStyle = '#E5A93B';
        const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;
            fCtx.beginPath();
            fCtx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                fCtx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                fCtx.lineTo(x, y);
                rot += step;
            }
            fCtx.lineTo(cx, cy - outerRadius);
            fCtx.closePath();
            fCtx.fill();
        };
        drawStar(140, 120, 5, 34, 16);

        // Formal Header
        fCtx.fillStyle = '#333333';
        fCtx.font = '500 22px "Noto Sans JP", sans-serif';
        fCtx.fillText('独立行政法人国立高等専門学校機構', 200, 100);
        fCtx.font = '700 34px "Noto Sans JP", sans-serif';
        fCtx.fillText('釧路工業高等専門学校', 200, 142);
        fCtx.font = '400 16px "Noto Sans JP", sans-serif';
        fCtx.fillStyle = '#666666';
        fCtx.fillText('National Institute of Technology (KOSEN), Kushiro College', 200, 172);

        // Field & Name
        fCtx.fillStyle = '#333333';
        fCtx.textAlign = 'center';
        fCtx.font = '500 26px "Noto Sans JP", sans-serif';
        fCtx.fillText('電子工学分野', 512, 310);
        fCtx.font = '700 56px "Noto Sans JP", sans-serif';
        fCtx.fillText('小田 空音', 512, 385);
        fCtx.font = '400 22px "Outfit", sans-serif';
        fCtx.fillStyle = '#777777';
        fCtx.fillText('Oda Kuto', 512, 424);

        // Divider
        fCtx.strokeStyle = '#CCCCCC';
        fCtx.lineWidth = 1.5;
        fCtx.beginPath();
        fCtx.moveTo(432, 450);
        fCtx.lineTo(592, 450);
        fCtx.stroke();

        // Footer details
        fCtx.font = '400 18px "Noto Sans JP", sans-serif';
        fCtx.fillStyle = '#555555';
        fCtx.fillText('HP https://odakuto.com', 512, 500);
        fCtx.fillText('Email kuuto9710@gmail.com', 512, 535);

        const frontTexture = new THREE.CanvasTexture(frontCanvas);

        // 2. Back Texture (Casual Entrepreneurship Club)
        const backCanvas = document.createElement('canvas');
        backCanvas.width = 1024;
        backCanvas.height = 620;
        const bCtx = backCanvas.getContext('2d');

        // Background
        bCtx.fillStyle = '#FFFFFF';
        bCtx.fillRect(0, 0, 1024, 620);

        // Avatar Placeholder / Icon
        bCtx.fillStyle = '#1e1b4b';
        bCtx.beginPath();
        bCtx.arc(380, 200, 75, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.fillStyle = '#FFFFFF';
        bCtx.font = '700 48px "Outfit", sans-serif';
        bCtx.textAlign = 'center';
        bCtx.fillText('KUTO', 380, 216);

        // Title & Role
        bCtx.textAlign = 'left';
        bCtx.fillStyle = '#111111';
        bCtx.font = '800 48px "Outfit", "Noto Sans JP", sans-serif';
        bCtx.fillText('ODA KUTO', 270, 340);
        bCtx.font = '600 24px "Noto Sans JP", sans-serif';
        bCtx.fillStyle = '#4f46e5';
        bCtx.fillText('アントレプレナーシップ部 部長', 270, 380);

        // Club Bold Title
        bCtx.font = '800 36px "Outfit", sans-serif';
        bCtx.fillStyle = '#111111';
        bCtx.fillText('EntrepreneurShip', 600, 240);
        bCtx.font = '800 32px "Outfit", sans-serif';
        bCtx.fillStyle = '#6366f1';
        bCtx.fillText('CLUB', 600, 280);

        // Flower / Idea Bulb Logo Accent
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        for (let i = 0; i < 5; i++) {
            const ang = (i / 5) * Math.PI * 2;
            bCtx.fillStyle = colors[i];
            bCtx.beginPath();
            bCtx.arc(630 + Math.cos(ang) * 22, 380 + Math.sin(ang) * 22, 16, 0, Math.PI * 2);
            bCtx.fill();
        }

        // Contact info on back
        bCtx.font = '400 17px "Noto Sans JP", sans-serif';
        bCtx.fillStyle = '#666666';
        bCtx.fillText('tel 070-8488-2691', 270, 440);
        bCtx.fillText('mail kuuto9710@gmail.com', 270, 470);
        bCtx.fillText('web odakuto.com', 270, 500);

        const backTexture = new THREE.CanvasTexture(backCanvas);

        // Material Array for BoxGeometry: [right, left, top, bottom, front, back]
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xF3F4F6, roughness: 0.8 });
        const materials = [
            edgeMaterial,
            edgeMaterial,
            edgeMaterial,
            edgeMaterial,
            new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.45 }),
            new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.45 })
        ];

        const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
        const cardMesh = new THREE.Mesh(cardGeo, materials);
        cardMesh.castShadow = true;
        scene.add(cardMesh);

        // Lights
        const cardAmbient = new THREE.AmbientLight(0xffffff, 1.4);
        scene.add(cardAmbient);

        const cardDirLight = new THREE.DirectionalLight(0xffffff, 1.1);
        cardDirLight.position.set(3, 4, 6);
        cardDirLight.castShadow = true;
        scene.add(cardDirLight);

        // Interaction (Tilt on hover, flip on click / button)
        let isCardFlipped = false;
        let cardTargetRotY = 0;
        let cardMouseX = 0;
        let cardMouseY = 0;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            cardMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            cardMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        });

        container.addEventListener('mouseleave', () => {
            cardMouseX = 0;
            cardMouseY = 0;
        });

        const flipCard = () => {
            isCardFlipped = !isCardFlipped;
            cardTargetRotY = isCardFlipped ? Math.PI : 0;
        };

        container.addEventListener('click', flipCard);

        const flipBtn = document.getElementById('card-flip-action-btn');
        if (flipBtn) {
            flipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                flipCard();
            });
        }

        // Visibility
        let isCardVisible = false;
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isCardVisible = entry.isIntersecting;
            });
        }, { threshold: 0.1 });
        cardObserver.observe(container);

        // Resize
        window.addEventListener('resize', () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });

        // Animation Loop
        const animateCard = () => {
            requestAnimationFrame(animateCard);
            if (!isCardVisible) return;

            // Interpolate toward target rotation
            cardMesh.rotation.y += (cardTargetRotY + cardMouseX * 0.45 - cardMesh.rotation.y) * 0.08;
            cardMesh.rotation.x += (-cardMouseY * 0.35 - cardMesh.rotation.x) * 0.08;
            cardMesh.position.y = Math.sin(Date.now() * 0.002) * 0.06;

            renderer.render(scene, camera);
        };

        animateCard();
    };

    // ==========================================================================
    // 4. UI TAB TOGGLES (3D vs 2D Image Switcher)
    // ==========================================================================
    const setupViewToggles = () => {
        // Vision Tab Switcher
        const vision3dBtn = document.getElementById('vision-view-3d');
        const vision2dBtn = document.getElementById('vision-view-2d');
        const vision3dStage = document.getElementById('vision-3d-stage');
        const vision2dStage = document.getElementById('vision-2d-stage');

        if (vision3dBtn && vision2dBtn && vision3dStage && vision2dStage) {
            vision3dBtn.addEventListener('click', () => {
                vision3dBtn.classList.add('active');
                vision2dBtn.classList.remove('active');
                vision3dStage.style.display = 'block';
                vision2dStage.style.display = 'none';
                setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
            });

            vision2dBtn.addEventListener('click', () => {
                vision2dBtn.classList.add('active');
                vision3dBtn.classList.remove('active');
                vision3dStage.style.display = 'none';
                vision2dStage.style.display = 'block';
            });
        }

        // Card Tab Switcher
        const card3dBtn = document.getElementById('card-view-3d');
        const card2dBtn = document.getElementById('card-view-2d');
        const card3dStage = document.getElementById('card-3d-stage');
        const card2dStage = document.getElementById('card-2d-stage');

        if (card3dBtn && card2dBtn && card3dStage && card2dStage) {
            card3dBtn.addEventListener('click', () => {
                card3dBtn.classList.add('active');
                card2dBtn.classList.remove('active');
                card3dStage.style.display = 'block';
                card2dStage.style.display = 'none';
                setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
            });

            card2dBtn.addEventListener('click', () => {
                card2dBtn.classList.add('active');
                card3dBtn.classList.remove('active');
                card3dStage.style.display = 'none';
                card2dStage.style.display = 'block';
            });
        }
    };

    // Initialize all modules when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        initHeroBackground();
        initVision3D();
        initBusinessCard3D();
        setupViewToggles();
        console.log('ODAKUTO img2threejs Procedural Engine Active');
    });

})();
