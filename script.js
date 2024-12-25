window.addEventListener('load', () => {
    const lenis = new Lenis({
        duration: 2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.2,
        touchMultiplier: 1.2,
        smooth: true,
        smoothTouch: true,
        lerp: 0.1
    });


    let lastScrollPos = 0;
    let ticking = false;

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    let images = [];
    let loadedImageCount = 0;

    function updateCameraForMobile() {
        if (window.innerWidth < 768) {
            camera.position.z *= 1.5; // Move camera back
            camera.position.y *= 0.8; // Adjust height
            parentMesh.scale.set(0.8, 0.8, 0.8); // Scale down mesh
        }
    }

    function loadImages() {
        for (let i = 1; i <= 7; i++) {
            const img = new Image();
            img.src = `./assets/img${i}.jpg`;
            console.log(`Attempting to load: ${img.src}`); // Debug log

            img.onload = function () {
                images.push(img);
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
            window.innerWidth < 768 ? 60 : 45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('canvas'),
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);

        const parentWidth = window.innerWidth < 768 ? 10 : 20;
        const parentHeight = window.innerWidth < 768 ? 37.5 : 75;
        const curvature = window.innerWidth < 768 ? 25 : 35;
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
            willReadFrequently: false,
        });
        textureCanvas.width = 1024;
        textureCanvas.height = 4096;

        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.generateMipmaps = false;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

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
            "Fashion\nEditorial",
            "Fashion\nEditorial",
            "SFX Makeup",
            "Fashion\nEditorial",
            "Local Brand",
        ]

        function updateTexture(offset = 0) {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

            const fontSize = 110;
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
                    console.log(`Image ${slideNumber} dimensions:`, img.width, img.height); // Debug dimensions
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
                    );
                    ctx.clip();

                    try {
                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                        console.log(`Successfully drew image ${slideNumber}`);
                    } catch (error) {
                        console.error(`Error drawing image ${slideNumber}:`, error);
                    }

                    ctx.restore();

                    ctx.shadowColor = "black";
                    ctx.shadowBlur = 90;
                    ctx.fillStyle = "white";
                    ctx.fillText(
                        slideTitles[slideIndex],
                        textureCanvas.width / 2,
                        wrappedY + slideRect.height / 2,
                    );
                }
            }

            texture.needsUpdate = true;
        }

        let currentScroll = 0;
        lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
            lastScrollPos = scroll / limit;

            if (!ticking) {
                requestAnimationFrame(() => {
                    updateTexture(-lastScrollPos);
                    renderer.render(scene, camera);
                    ticking = false;
                });
                ticking = true;
            }
        });

        let resizeTimeout;
        window.addEventListener("resize", () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                updateCameraForMobile();
            }, 250);
        });

        updateTexture(0);
        renderer.render(scene, camera);
    }

    loadImages();
});