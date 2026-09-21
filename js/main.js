// ============================================================
// GALAXIA DE AMOR - main.js
// Versión corregida y adaptada para PC + celular
// ============================================================

// ------------------------------------------------------------
// CONFIGURACIÓN DE INTRO
// ------------------------------------------------------------
let introStartTime = null;

let heartPoints = null;
let explosionPoints = null;

const INTRO = {
    heartBuild: 3.2,   // tiempo formando el corazón
    heartPause: 0.7,   // corazón completo antes de explotar
    explosion: 1.5     // explosión y formación de la galaxia
};


// ------------------------------------------------------------
// RESPONSIVE
// ------------------------------------------------------------
const isMobile = window.matchMedia("(max-width: 700px)").matches;
// La experiencia 3D usa ahora los mismos valores en PC y celular.

const PARTICLE_COUNT = {
    heart: APP_CONFIG.heartParticles,
    paws: APP_CONFIG.pawParticles,
    cats: APP_CONFIG.catParticles,
    stars: APP_CONFIG.stars
};

function getCameraDistance() {
    return APP_CONFIG.camera.startZ;
}


// ------------------------------------------------------------
// ELEMENTOS DEL DOM
// ------------------------------------------------------------
const loginScreen = document.getElementById("login-screen");
const galaxyScreen = document.getElementById("galaxy-screen");

const dateForm = document.getElementById("date-form");
const dateInput = document.getElementById("relationship-date");
dateInput.addEventListener(
    "input",
    () => {

        let value =
            dateInput.value
            .replace(/\D/g, "")
            .slice(0, 8);


        if (value.length >= 5) {

            value =
                value.slice(0, 2)
                +
                "/"
                +
                value.slice(2, 4)
                +
                "/"
                +
                value.slice(4);

        }
        else if (value.length >= 3) {

            value =
                value.slice(0, 2)
                +
                "/"
                +
                value.slice(2);

        }


        dateInput.value =
            value;

    }
);
const loginMessage = document.getElementById("login-message");

const viewer = document.getElementById("viewer");
const phraseLayer = document.getElementById("phrase-layer");

const galaxyTitle = document.getElementById("galaxy-title");
const galaxySubtitle = document.getElementById("galaxy-subtitle");

const centerButton = document.getElementById("center-button");


// ------------------------------------------------------------
// THREE.JS
// ------------------------------------------------------------
let scene;
let camera;
let renderer;
let controls;
let clock;

let heartGroup;
let photoGroup;

let paws;
let cats;
let stars;

let galaxyStarted = false;


// ------------------------------------------------------------
// ESTADO
// ------------------------------------------------------------
const state = {
    phrases: [],
    photos: []
};


// ============================================================
// LOGIN
// ============================================================

dateForm.addEventListener("submit", event => {
    event.preventDefault();

    const selectedDate = dateInput.value;

    if (!selectedDate) {
        showLoginMessage(
            
        );
        return;
    }

    if (selectedDate === APP_CONFIG.relationshipDate) {
        showLoginMessage(
            
        );

        loginScreen.classList.add("exit");

        setTimeout(() => {
            loginScreen.classList.add("hidden");
            galaxyScreen.classList.remove("hidden");

            if (!galaxyStarted) {
                initGalaxy();
                animate();
                galaxyStarted = true;
            }
        }, 800);

    } else {
        showLoginMessage(
            
        );

        shakeLogin();
    }
});


function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `login-message ${type}`;
}


function shakeLogin() {
    const card = document.querySelector(".login-card");

    if (!card) return;

    card.animate(
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-8px)" },
            { transform: "translateX(8px)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(0)" }
        ],
        {
            duration: 350
        }
    );
}


// ============================================================
// INICIAR GALAXIA
// ============================================================

function initGalaxy() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
    );

    camera.position.set(
        0,
        0,
        getCameraDistance()
    );

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    viewer.appendChild(renderer.domElement);

    // Evita que el navegador intercepte los gestos táctiles
    renderer.domElement.style.touchAction = "none";

    controls = new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.045;

    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.screenSpacePanning = true;

    // Bloqueados durante la animación inicial
    controls.enabled = false;

    // Sensibilidad diferente en celular
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1;
    controls.panSpeed = 1;

    // Evita que al hacer mucho zoom la cámara atraviese el centro
    // y termine dejando las partículas detrás de ella.
    controls.minDistance = Math.max(
        APP_CONFIG.camera.minDistance,
        10
    );

    controls.maxDistance = APP_CONFIG.camera.maxDistance;

    controls.target.set(0, 0, 0);

    clock = new THREE.Clock();

    heartGroup = new THREE.Group();
    photoGroup = new THREE.Group();

    scene.add(heartGroup);
    scene.add(photoGroup);

    galaxyTitle.textContent = APP_CONFIG.title;
    galaxySubtitle.textContent = APP_CONFIG.subtitle;

    createHeart();
    createExplosion();
    createPaws();
    createCats();
    createStars();
    createPhrases();
    createPhotos();

    introStartTime = performance.now();

    window.addEventListener("resize", resize);
}


// ============================================================
// CORAZÓN
// ============================================================

function createHeart() {
    const startPositions = [];
    const targetPositions = [];

    const texture = createGlowTexture();

    for (let i = 0; i < PARTICLE_COUNT.heart; i++) {
        // Posición final del corazón
        const t = Math.random() * Math.PI * 2;
        const fill = Math.sqrt(Math.random());

        let x =
            16 *
            Math.pow(
                Math.sin(t),
                3
            );

        let y =
            13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t);

        x *= fill * 0.58;
        y *= fill * 0.58;

        const z =
            (Math.random() - 0.5) * 4;

        targetPositions.push(
            x,
            y,
            z
        );

        // Posición inicial dispersa
        const angle =
            Math.random() *
            Math.PI *
            2;

        const radius =
            15 +
            Math.random() * 30;

        const startX =
            Math.cos(angle) *
            radius;

        const startY =
            (Math.random() - 0.5) *
            30;

        const startZ =
            Math.sin(angle) *
            radius;

        startPositions.push(
            startX,
            startY,
            startZ
        );
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            startPositions,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 0.20,
            color: 0xff4d94,
            map: texture,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

    heartPoints =
        new THREE.Points(
            geometry,
            material
        );

    // Las posiciones cambian durante la animación.
    // Evitamos que Three.js oculte todo el grupo por un cálculo
    // de visibilidad basado en posiciones antiguas.
    heartPoints.frustumCulled = false;

    heartPoints.userData.startPositions =
        startPositions;

    heartPoints.userData.targetPositions =
        targetPositions;

    heartGroup.add(heartPoints);
}


// ============================================================
// EXPLOSIÓN
// ============================================================

function createExplosion() {
    const count = 1600;

    const positions = [];
    const directions = [];

    for (let i = 0; i < count; i++) {
        positions.push(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );

        const direction =
            new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

        directions.push(
            direction.x,
            direction.y,
            direction.z
        );
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 0.25,
            map: createGlowTexture(),
            color: 0xff77ad,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

    explosionPoints =
        new THREE.Points(
            geometry,
            material
        );

    explosionPoints.frustumCulled = false;

    explosionPoints.userData.directions =
        directions;

    scene.add(explosionPoints);
}


// ============================================================
// PATITAS
// ============================================================

function createPaws() {
    const targetPositions =
        createCloudPositions(
            PARTICLE_COUNT.paws,
            12,
            55
        );

    const startPositions = [];

    for (let i = 0; i < PARTICLE_COUNT.paws; i++) {
        startPositions.push(
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1
        );
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            startPositions,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 0.8,
            map: createPawTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            alphaTest: 0.03
        });

    paws =
        new THREE.Points(
            geometry,
            material
        );

    paws.frustumCulled = false;

    paws.userData.startPositions =
        startPositions;

    paws.userData.targetPositions =
        targetPositions;

    scene.add(paws);
}


// ============================================================
// CARITAS DE GATO
// ============================================================

function createCats() {
    const targetPositions =
        createCloudPositions(
            PARTICLE_COUNT.cats,
            15,
            60
        );

    const startPositions = [];

    for (let i = 0; i < PARTICLE_COUNT.cats; i++) {
        startPositions.push(
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1
        );
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            startPositions,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 1.05,
            map: createCatTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            alphaTest: 0.04
        });

    cats =
        new THREE.Points(
            geometry,
            material
        );

    cats.frustumCulled = false;

    cats.userData.startPositions =
        startPositions;

    cats.userData.targetPositions =
        targetPositions;

    scene.add(cats);
}


// ============================================================
// POSICIONES DE LA GALAXIA
// ============================================================

function createCloudPositions(
    amount,
    minRadius,
    maxRadius
) {
    const positions = [];

    for (let i = 0; i < amount; i++) {
        const angle =
            Math.random() *
            Math.PI *
            2;

        const radius =
            minRadius +
            Math.random() *
            (maxRadius - minRadius);

        const x =
            Math.cos(angle) *
            radius;

        const z =
            Math.sin(angle) *
            radius;

        const verticalSpread = 26;

        const y =
            (Math.random() - 0.5) *
            verticalSpread;

        positions.push(
            x,
            y,
            z
        );
    }

    return positions;
}


// ============================================================
// ESTRELLAS
// ============================================================

function createStars() {
    const targetPositions = [];
    const startPositions = [];

    for (let i = 0; i < PARTICLE_COUNT.stars; i++) {
        const radius =
            55 +
            Math.random() * 160;

        const theta =
            Math.random() *
            Math.PI *
            2;

        const phi =
            Math.acos(
                2 *
                Math.random()
                -
                1
            );

        targetPositions.push(
            radius *
            Math.sin(phi) *
            Math.cos(theta),

            radius *
            Math.sin(phi) *
            Math.sin(theta),

            radius *
            Math.cos(phi)
        );

        startPositions.push(
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1
        );
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            startPositions,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 0.14,
            map: createGlowTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

    stars =
        new THREE.Points(
            geometry,
            material
        );

    stars.frustumCulled = false;

    stars.userData.startPositions =
        startPositions;

    stars.userData.targetPositions =
        targetPositions;

    scene.add(stars);
}


// ============================================================
// FRASES
// ============================================================

function createPhrases() {
    phraseLayer.innerHTML = "";
    state.phrases = [];

    APP_CONFIG.phrases.forEach(
        (text, index) => {
            const element =
                document.createElement("div");

            element.className = "phrase";
            element.textContent = text;

            phraseLayer.appendChild(element);

            const angle =
                (
                    index /
                    APP_CONFIG.phrases.length
                ) *
                Math.PI *
                2;

            state.phrases.push({
                element,

                angle:
                    angle +
                    Math.random(),

                radius:
                    15 + Math.random() * 38,

                y:
                    (Math.random() - 0.5) * 34,

                offset:
                    Math.random() *
                    Math.PI *
                    2
            });
        }
    );
}


// ============================================================
// FOTOS
// ============================================================

function createPhotos() {
    const loader =
        new THREE.TextureLoader();

    state.photos = [];

    APP_CONFIG.photos.forEach(
        (photo, index) => {
            loader.load(
                photo.src,

                texture => {
                    const material =
                        new THREE.SpriteMaterial({
                            map: texture,
                            transparent: true,
                            opacity: 0
                        });

                    const sprite =
                        new THREE.Sprite(
                            material
                        );

                    const total =
                        Math.max(
                            APP_CONFIG.photos.length,
                            1
                        );

                    const angle =
                        (
                            index /
                            total
                        ) *
                        Math.PI *
                        2
                        +
                        Math.random() * 0.8;

                    // Distancia final de las fotos
                    const radius =
                        15 + Math.random() * 35;

                    const finalY =
                        (Math.random() - 0.5) * 28;

                    // Mantiene la proporción real de la imagen
                    const imageRatio =
                        texture.image.width /
                        texture.image.height;

                    // TAMAÑO FINAL DE LAS FOTOS
                    // Cambia estos valores si luego quieres hacerlas
                    // todavía más pequeñas o más grandes.
                    const finalHeight = 2.8;

                    const finalWidth =
                        finalHeight *
                        imageRatio;

                    // Empieza casi invisible y pequeña
                    sprite.scale.set(
                        0.1,
                        0.1,
                        1
                    );

                    // Todas nacen desde el corazón
                    const startPosition =
                        new THREE.Vector3(
                            (Math.random() - 0.5) * 0.8,
                            (Math.random() - 0.5) * 0.8,
                            (Math.random() - 0.5) * 0.8
                        );

                    // Posición definitiva dentro de la galaxia
                    const targetPosition =
                        new THREE.Vector3(
                            Math.cos(angle) *
                            radius,

                            finalY,

                            Math.sin(angle) *
                            radius
                        );

                    sprite.position.copy(
                        startPosition
                    );

                    sprite.userData = {
                        startPosition,
                        targetPosition,

                        finalScale:
                            new THREE.Vector3(
                                finalWidth,
                                finalHeight,
                                1
                            )
                    };

                    photoGroup.add(sprite);
                    state.photos.push(sprite);
                },

                undefined,

                error => {
                    console.warn(
                        "No se pudo cargar la imagen:",
                        photo.src,
                        error
                    );
                }
            );
        }
    );
}


// ============================================================
// TEXTURA DE PATITA
// ============================================================

function createPawTexture() {
    const canvas =
        document.createElement("canvas");

    canvas.width = 128;
    canvas.height = 128;

    const ctx =
        canvas.getContext("2d");

    ctx.shadowColor =
        "rgba(255,70,140,0.8)";

    ctx.shadowBlur = 15;

    ctx.fillStyle =
        "#ff9bc2";

    // Almohadilla central
    ctx.beginPath();

    ctx.ellipse(
        64,
        79,
        25,
        21,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Deditos
    const toes = [
        [39, 50, 10, 14, -0.35],
        [57, 38, 10, 14, -0.10],
        [75, 38, 10, 14, 0.10],
        [93, 50, 10, 14, 0.35]
    ];

    toes.forEach(toe => {
        ctx.beginPath();

        ctx.ellipse(
            toe[0],
            toe[1],
            toe[2],
            toe[3],
            toe[4],
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.needsUpdate = true;

    return texture;
}


// ============================================================
// TEXTURA DE CARITA DE GATO
// ============================================================

function createCatTexture() {
    const canvas =
        document.createElement("canvas");

    canvas.width = 128;
    canvas.height = 128;

    const ctx =
        canvas.getContext("2d");

    ctx.shadowColor =
        "rgba(255,70,140,0.8)";

    ctx.shadowBlur = 12;

    // Orejas
    ctx.fillStyle =
        "#ff9fc8";

    ctx.beginPath();

    ctx.moveTo(33, 45);
    ctx.lineTo(37, 15);
    ctx.lineTo(56, 37);

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(72, 37);
    ctx.lineTo(91, 15);
    ctx.lineTo(95, 45);

    ctx.fill();

    // Cabeza
    ctx.beginPath();

    ctx.arc(
        64,
        64,
        40,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Ojos
    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#290014";

    ctx.beginPath();

    ctx.arc(
        50,
        60,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        78,
        60,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Nariz
    ctx.fillStyle =
        "#ff3f85";

    ctx.beginPath();

    ctx.moveTo(64, 70);
    ctx.lineTo(59, 76);
    ctx.lineTo(69, 76);

    ctx.closePath();
    ctx.fill();

    // Boca
    ctx.strokeStyle =
        "#350019";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(64, 76);

    ctx.quadraticCurveTo(
        59,
        82,
        55,
        79
    );

    ctx.moveTo(64, 76);

    ctx.quadraticCurveTo(
        69,
        82,
        73,
        79
    );

    ctx.stroke();

    // Bigotes
    ctx.strokeStyle =
        "rgba(90,0,40,0.8)";

    ctx.beginPath();

    ctx.moveTo(47, 74);
    ctx.lineTo(22, 68);

    ctx.moveTo(47, 79);
    ctx.lineTo(21, 80);

    ctx.moveTo(81, 74);
    ctx.lineTo(106, 68);

    ctx.moveTo(81, 79);
    ctx.lineTo(107, 80);

    ctx.stroke();

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.needsUpdate = true;

    return texture;
}


// ============================================================
// TEXTURA DE BRILLO
// ============================================================

function createGlowTexture() {
    const canvas =
        document.createElement("canvas");

    canvas.width = 64;
    canvas.height = 64;

    const ctx =
        canvas.getContext("2d");

    const gradient =
        ctx.createRadialGradient(
            32,
            32,
            0,
            32,
            32,
            32
        );

    gradient.addColorStop(
        0,
        "rgba(255,255,255,1)"
    );

    gradient.addColorStop(
        0.2,
        "rgba(255,170,210,0.95)"
    );

    gradient.addColorStop(
        0.5,
        "rgba(255,50,130,0.5)"
    );

    gradient.addColorStop(
        1,
        "rgba(255,0,90,0)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        64,
        64
    );

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.needsUpdate = true;

    return texture;
}


// ============================================================
// ACTUALIZAR FRASES
// ============================================================

function updatePhrases(time) {
    state.phrases.forEach(
        phrase => {
            const angle =
                phrase.angle +
                time * 0.04;

            const worldPosition =
                new THREE.Vector3(
                    Math.cos(angle) *
                    phrase.radius,

                    phrase.y +
                    Math.sin(
                        time +
                        phrase.offset
                    ) *
                    0.5,

                    Math.sin(angle) *
                    phrase.radius
                );

            const projected =
                worldPosition
                .clone()
                .project(camera);

            const x =
                (
                    projected.x *
                    0.5 +
                    0.5
                ) *
                window.innerWidth;

            const y =
                (
                    -projected.y *
                    0.5 +
                    0.5
                ) *
                window.innerHeight;

            const visible =
                projected.z > -1 &&
                projected.z < 1 &&
                x > -180 &&
                x < window.innerWidth + 180 &&
                y > -80 &&
                y < window.innerHeight + 80;

            phrase.element.style.left =
                `${x}px`;

            phrase.element.style.top =
                `${y}px`;

            phrase.element.style.opacity =
                visible
                    ? 0.9
                    : 0;
        }
    );
}


// ============================================================
// CENTRAR VISTA
// ============================================================

centerButton.addEventListener(
    "click",
    () => {
        if (!controls || !camera) {
            return;
        }

        camera.position.set(
            0,
            0,
            getCameraDistance()
        );

        controls.target.set(
            0,
            0,
            0
        );

        controls.update();
    }
);


// ============================================================
// FUNCIONES DE ANIMACIÓN
// ============================================================

function clamp01(value) {
    return Math.max(
        0,
        Math.min(
            1,
            value
        )
    );
}


function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 -
          Math.pow(
              -2 * t + 2,
              3
          ) / 2;
}


function easeOutCubic(t) {
    return 1 -
        Math.pow(
            1 - t,
            3
        );
}


function interpolateParticles(
    object,
    progress
) {
    if (
        !object ||
        !object.userData.startPositions ||
        !object.userData.targetPositions
    ) {
        return;
    }

    const positions =
        object.geometry
        .attributes
        .position
        .array;

    const start =
        object.userData.startPositions;

    const target =
        object.userData.targetPositions;

    for (
        let i = 0;
        i < positions.length;
        i++
    ) {
        positions[i] =
            start[i] +
            (
                target[i] -
                start[i]
            ) *
            progress;
    }

    object.geometry
        .attributes
        .position
        .needsUpdate = true;
}


function animateExplosion(progress) {
    if (!explosionPoints) {
        return;
    }

    const positions =
        explosionPoints
        .geometry
        .attributes
        .position
        .array;

    const directions =
        explosionPoints
        .userData
        .directions;

    const distance =
        easeOutCubic(progress) * 55;

    for (
        let i = 0;
        i < positions.length;
        i += 3
    ) {
        positions[i] =
            directions[i] *
            distance;

        positions[i + 1] =
            directions[i + 1] *
            distance;

        positions[i + 2] =
            directions[i + 2] *
            distance;
    }

    explosionPoints
        .geometry
        .attributes
        .position
        .needsUpdate = true;

    explosionPoints.material.opacity =
        progress < 0.25
            ? progress * 4
            : 1 - progress;
}


function updatePhotosExplosion(progress) {
    const normalized =
        clamp01(progress);

    const eased =
        easeOutCubic(
            normalized
        );

    state.photos.forEach(
        sprite => {
            const data =
                sprite.userData;

            if (
                !data.startPosition ||
                !data.targetPosition ||
                !data.finalScale
            ) {
                return;
            }

            // Sale desde el corazón hacia su posición final
            sprite.position.lerpVectors(
                data.startPosition,
                data.targetPosition,
                eased
            );

            // Crece desde casi 0 hasta el tamaño final
            const scaleProgress =
                THREE.MathUtils.smoothstep(
                    normalized,
                    0.05,
                    0.8
                );

            sprite.scale.set(
                data.finalScale.x *
                scaleProgress,

                data.finalScale.y *
                scaleProgress,

                1
            );

            // Aparece durante la explosión
            sprite.material.opacity =
                THREE.MathUtils.clamp(
                    normalized * 1.5,
                    0,
                    0.9
                );
        }
    );
}


// ============================================================
// LOOP PRINCIPAL
// ============================================================

function animate() {
    requestAnimationFrame(animate);

    const time =
        clock.getElapsedTime();

    const introTime =
        (
            performance.now() -
            introStartTime
        ) /
        1000;


    // --------------------------------------------------------
    // ETAPA 1: formar corazón
    // --------------------------------------------------------
    if (
        introTime <
        INTRO.heartBuild
    ) {
        const progress =
            clamp01(
                introTime /
                INTRO.heartBuild
            );

        const eased =
            easeInOutCubic(
                progress
            );

        interpolateParticles(
            heartPoints,
            eased
        );

        heartGroup.rotation.y +=
            0.001;
    }


    // --------------------------------------------------------
    // ETAPA 2: corazón completo + latido
    // --------------------------------------------------------
    else if (
        introTime <
        INTRO.heartBuild +
        INTRO.heartPause
    ) {
        interpolateParticles(
            heartPoints,
            1
        );

        const localTime =
            introTime -
            INTRO.heartBuild;

        const beat =
            1 +
            Math.sin(
                localTime *
                Math.PI *
                4
            ) *
            0.06;

        heartGroup.scale.set(
            beat,
            beat,
            beat
        );
    }


    // --------------------------------------------------------
    // ETAPA 3: explosión y formación de galaxia
    // --------------------------------------------------------
    else if (
        introTime <
        INTRO.heartBuild +
        INTRO.heartPause +
        INTRO.explosion
    ) {
        const explosionStart =
            INTRO.heartBuild +
            INTRO.heartPause;

        const progress =
            clamp01(
                (
                    introTime -
                    explosionStart
                ) /
                INTRO.explosion
            );

        animateExplosion(
            progress
        );

        const heartScale =
            1 +
            Math.sin(
                progress *
                Math.PI
            ) *
            0.18;

        heartGroup.scale.set(
            heartScale,
            heartScale,
            heartScale
        );

        const galaxyProgress =
            easeOutCubic(
                progress
            );

        interpolateParticles(
            paws,
            galaxyProgress
        );

        interpolateParticles(
            cats,
            galaxyProgress
        );

        interpolateParticles(
            stars,
            galaxyProgress
        );

        updatePhotosExplosion(
            galaxyProgress
        );

        if (paws) {
            paws.material.opacity =
                progress * 0.82;
        }

        if (cats) {
            cats.material.opacity =
                progress * 0.86;
        }

        if (stars) {
            stars.material.opacity =
                progress * 0.72;
        }
    }


    // --------------------------------------------------------
    // ETAPA 4: galaxia completa e interactiva
    // --------------------------------------------------------
    else {
        interpolateParticles(
            paws,
            1
        );

        interpolateParticles(
            cats,
            1
        );

        interpolateParticles(
            stars,
            1
        );

        updatePhotosExplosion(1);

        if (paws) {
            paws.material.opacity = 0.82;
        }

        if (cats) {
            cats.material.opacity = 0.86;
        }

        if (stars) {
            stars.material.opacity = 0.72;
        }

        if (explosionPoints) {
            explosionPoints.material.opacity = 0;
        }

        // Aquí recién puede mover, rotar y hacer zoom
        controls.enabled = true;

        heartGroup.rotation.y +=
            0.0015;

        const heartbeat =
            1 +
            Math.sin(
                time * 2
            ) *
            0.025;

        heartGroup.scale.set(
            heartbeat,
            heartbeat,
            heartbeat
        );

        if (paws) {
            paws.rotation.y +=
                0.0004;
        }

        if (cats) {
            cats.rotation.y -=
                0.0003;
        }

        if (stars) {
            stars.rotation.y +=
                0.0001;
        }
    }


    // --------------------------------------------------------
    // FRASES Y ENCABEZADO
    // --------------------------------------------------------
    const revealStart =
        INTRO.heartBuild +
        INTRO.heartPause +
        INTRO.explosion;

    if (
        introTime >
        revealStart
    ) {
        updatePhrases(time);

        const header =
            document.querySelector(
                ".galaxy-header"
            );

        if (header) {
            header.classList.add(
                "visible"
            );
        }
    }

    controls.update();

    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// RESPONSIVE / RESIZE
// ============================================================

function resize() {
    if (
        !camera ||
        !renderer
    ) {
        return;
    }

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );
}
