window.addEventListener('load', () => {
    let lenis;
    const isMobile = window.innerWidth < 768;
    let lastScrollY = window.scrollY;
    let scheduledAnimationFrame = false;
    let scrollVelocity = 0;
    const velocityFactor = 0.1;
    let lastScrollTime = Date.now();
    const lerp = (start, end, t) => start * (1 - t) + end * t;

    if (!isMobile) {
        lenis = new Lenis({
            duration: 2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1.2,
            touchMultiplier: 1.2,
            smooth: true,
            smoothTouch: false,
            lerp: 0.1
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    let lastScrollPos = 0;
    let ticking = false;

    let images = [];
    let loadedImageCount = 0;
    let textureUpdateThreshold = 1;

    function loadImages() {
        for (let i = 1; i <= 7; i++) {
            const img = new Image();
            img.src = `./assets/img${i}.jpg`;
            console.log(`Attempting to load: ${img.src}`); // Debug log

            img.onload = function () {
                images[i - 1] = img;
                loadedImageCount++;
                console.log(`Successfully loaded image ${i}, count: ${loadedImageCount}`);

                if (loadedImageCount === 7) {
                    initializeScene();
                }
            };

            img.onerror = function (e) {
                console.error(`Error loading image ${i}:`, e);
                loadedImageCount++;

                if (loadedImageCount === 7) {
                    initializeScene();
                }
            };
        }
    }

    function initializeScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            isMobile ? 55 : 45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('canvas'),
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            stencil: false,
            depth: false,
            alpha: false
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);

        // Enable WebGL optimizations
        renderer.info.autoReset = false;
        const gl = renderer.getContext();
        gl.getExtension('WEBGL_lose_context');

        const parentWidth = isMobile ? 10 : 20;
        const parentHeight = isMobile ? 37.5 : 75;
        const curvature = isMobile ? 25 : 35;
        const segmentsX = 200;
        const segmentsY = 200;

        const parentGeometry = new THREE.PlaneGeometry(parentWidth, parentHeight, segmentsX, segmentsY);

        const positions = parentGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            const distanceFromCenter = Math.abs(y / (parentHeight / 2));
            positions[i + 2] = Math.pow(distanceFromCenter, 2) * curvature;
        }
        parentGeometry.computeVertexNormals();

        const totalSlides = 7;
        const slideHeight = 15;
        const gap = 0.5;
        const cycleHeight = totalSlides * (slideHeight + gap);

        const textureCanvas = document.createElement('canvas');
        const ctx = textureCanvas.getContext('2d', {
            alpha: false,
            willReadFrequently: false
        });

        const textureDivisor = isMobile ? 1.1 : 1;
        textureCanvas.width = 1024 / textureDivisor;
        textureCanvas.height = 4096 / textureDivisor;

        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.generateMipmaps = false;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = isMobile ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());

        const parentMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const parentMesh = new THREE.Mesh(parentGeometry, parentMaterial);
        parentMesh.position.set(0, -1, 0);
        parentMesh.rotation.x = THREE.MathUtils.degToRad(-20);
        parentMesh.rotation.y = THREE.MathUtils.degToRad(20);
        scene.add(parentMesh);

        const distance = 17.5;
        const heightOffset = 5;
        const offsetX = distance * Math.sin(THREE.MathUtils.degToRad(20));
        const offsetZ = distance * Math.cos(THREE.MathUtils.degToRad(20));

        camera.position.set(offsetX, heightOffset, offsetZ);
        camera.lookAt(0, -2, 0);
        camera.rotation.z = THREE.MathUtils.degToRad(-5);

        const slideTitles = [
            "SFX Makeup",
            "Worlwide Magazine",
            "Fashion Editorial",
            "Fashion Editorial",
            "SFX Makeup",
            "Fashion Editorial",
            "Local Brand",
        ]

        const slideDescriptions = [
            "Halloween Makeup For Salma",
            "Makeup for Vogue Magazine",
            "Fashion Magazine Makeup",
            "Fashion Magazine Makeup",
            "Halloween Makeup for Karma",
            "Fashion Magazine Makeup",
            "Sagshop Local Brand Makeup",
        ]

        let currentOpacity = 0;
        let currentScale = 0;
        const animationSpeed = isMobile ? 0.0028 : 0.004;

        function updateTexture(offset = 0) {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

            const fontSize = isMobile ? 100 : 110;;
            ctx.font = `500 ${fontSize}px Dahlia`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (let i = 0; i < totalSlides; i++) {
                let slideY = i * (slideHeight + gap);
                slideY += offset * cycleHeight;

                const textureY = (slideY / cycleHeight) * textureCanvas.height;
                let wrappedY = textureY % textureCanvas.height;
                if (wrappedY < 0) wrappedY += textureCanvas.height;

                let slideIndex = totalSlides - i - 1;
                let slideNumber = slideIndex + 1;

                const slideRect = {
                    x: textureCanvas.width * 0.05,
                    y: wrappedY,
                    width: textureCanvas.width * 0.9,
                    height: (slideHeight / cycleHeight) * textureCanvas.height,
                };

                const img = images[slideNumber - 1];
                if (img) {
                    console.log(`Image ${slideNumber} dimensions:`, img.width, img.height);
                    const imgAspect = img.width / img.height;
                    const rectAspect = slideRect.width / slideRect.height;

                    let drawWidth, drawHeight, drawX, drawY;

                    if (imgAspect > rectAspect) {
                        drawHeight = slideRect.height;
                        drawWidth = slideRect.height * imgAspect;
                    } else {
                        drawWidth = slideRect.width;
                        drawHeight = slideRect.width / imgAspect;
                    }

                    drawX = slideRect.x + (slideRect.width - drawWidth) / 2;
                    drawY = slideRect.y + (slideRect.height - drawHeight) / 2;

                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(
                        slideRect.x,
                        slideRect.y,
                        slideRect.width,
                        slideRect.height,
                        0
                    );
                    ctx.clip();

                    try {
                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                        console.log(`Successfully drew image ${slideNumber}`);
                    } catch (error) {
                        console.error(`Error drawing image ${slideNumber}:`, error);
                    }

                    ctx.restore();
                    ctx.save();

                    // Calculate distance from center
                    const viewportCenter = textureCanvas.height / 2.1;
                    const slideCenter = wrappedY + slideRect.height / 2;
                    const distanceFromCenter = Math.abs(viewportCenter - slideCenter);
                    const maxDistance = textureCanvas.height / 4;
                    const distanceToCalculate = isMobile ? 0.72 : 0.79
                    // Calculate distance based on distance
                    const distance = Math.max(0, 1 - (distanceFromCenter / maxDistance));

                    currentOpacity = lerp(currentOpacity, distance, animationSpeed);
                    currentScale = lerp(currentScale, distance > distanceToCalculate ? 6 : 0, animationSpeed);

                    ctx.shadowColor = "black";
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = "#fff";
                    const fontSize = isMobile ? 100 : 110;;
                    ctx.font = `500 ${fontSize}px Dahlia`;
                    ctx.fillText(
                        slideTitles[slideIndex],
                        textureCanvas.width / 2,
                        wrappedY + slideRect.height / 2,
                    );
                    
                    if (distance > distanceToCalculate) {
                        ctx.font = `400 ${fontSize * 0.6}px Inter`;
                        ctx.transform(
                            currentScale, 0, 0, currentScale,
                            textureCanvas.width / 2 * (1 - currentScale),
                            (wrappedY + slideRect.height * 0.7) * (1 - currentScale)
                        );
                        ctx.fillText(
                            slideDescriptions[slideIndex],
                            textureCanvas.width / 2,
                            wrappedY + slideRect.height * 0.7
                        );
                    }
                    ctx.restore();
                }
            }

            texture.needsUpdate = true;
        }

        if (isMobile) {
            let touchStartY = 0;
            let lastTouchY = 0;

            window.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
                lastTouchY = touchStartY;
                scrollVelocity = 0;
            }, { passive: true });

            // Add touch move handler
            window.addEventListener('touchmove', (e) => {
                const currentY = e.touches[0].clientY;
                const deltaY = lastTouchY - currentY;
                lastTouchY = currentY;

                const currentTime = Date.now();
                const deltaTime = currentTime - lastScrollTime;
                lastScrollTime = currentTime;

                if (deltaTime > 0) {
                    scrollVelocity = (deltaY / deltaTime) * velocityFactor;
                }
            }, { passive: true });

            // Improved scroll handler with momentum
            window.addEventListener("scroll", () => {
                if (scheduledAnimationFrame) return;

                scheduledAnimationFrame = true;
                requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollDelta = currentScrollY - lastScrollY;

                    // Apply velocity-based threshold
                    const effectiveThreshold = Math.max(
                        textureUpdateThreshold,
                        Math.abs(scrollVelocity) * 2
                    );

                    if (Math.abs(scrollDelta) > effectiveThreshold) {
                        const scrollOffset = Math.max(0, currentScrollY - window.innerHeight);
                        const newScrollPos = scrollOffset /
                            (document.documentElement.scrollHeight - window.innerHeight * 2);

                        // Apply smooth interpolation
                        lastScrollPos += (newScrollPos - lastScrollPos) * 0.3;

                        if (currentScrollY > window.innerHeight) {
                            updateTexture(-lastScrollPos);
                            renderer.render(scene, camera);
                        }

                        lastScrollY = currentScrollY;
                    }

                    // Decay scroll velocity
                    scrollVelocity *= 0.95;
                    scheduledAnimationFrame = false;
                });
            }, { passive: true });

            // Add momentum scrolling on touch end
            window.addEventListener('touchend', () => {
                let momentum = scrollVelocity;

                function applyMomentum() {
                    if (Math.abs(momentum) > 0.01) {
                        lastScrollY += momentum;
                        momentum *= 0.95; // Decay factor
                        requestAnimationFrame(applyMomentum);
                    }
                }

                if (Math.abs(scrollVelocity) > 0.1) {
                    requestAnimationFrame(applyMomentum);
                }
            }, { passive: true });
        } else {
            lenis.on("scroll", ({ scroll, limit }) => {
                const scrollOffset = Math.max(0, scroll - window.innerHeight); // Subtract 100vh
                lastScrollPos = scrollOffset / (limit - window.innerHeight);

                if (!ticking) {
                    requestAnimationFrame(() => {
                        if (scroll > window.innerHeight) { // Only render after 100vh
                            updateTexture(-lastScrollPos);
                            renderer.render(scene, camera);
                        }
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        }

        let resizeTimeout;
        window.addEventListener("resize", () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                const newWidth = window.innerWidth;
                const newHeight = window.innerHeight;
                renderer.setSize(newWidth, newHeight);
                renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

                updateTexture(-lastScrollPos);
                renderer.render(scene, camera);
            }, 250);
        });

        updateTexture(-1);
        renderer.render(scene, camera);
    }

    loadImages();
});