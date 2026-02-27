import * as THREE from 'three';

export function createScene() {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    // Enhanced fog for better distance-based visibility (objects fade into fog when far)
    // FogExp2: color, density (higher = more fog, objects fade faster)
    scene.fog = new THREE.FogExp2(0xffb6c1, 0.015); // Slightly increased density for better far-object fading

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Sky
    scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(500, 32, 15),
        new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0xff99cc) },
                bottomColor: { value: new THREE.Color(0xffe6f2) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `varying vec3 vW; void main(){ vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
            fragmentShader: `uniform vec3 topColor,bottomColor; uniform float offset,exponent; varying vec3 vW;
        void main(){ float h=normalize(vW+offset).y; gl_FragColor=vec4(mix(bottomColor,topColor,max(pow(max(h,0.),exponent),0.)),1.); }`,
            side: THREE.BackSide
        })
    ));

    // Terrain
    const floorGeo = new THREE.PlaneGeometry(600, 600, 200, 200);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({
        color: 0xff66b2,
        roughness: 0.7,
        metalness: 0.1,
        flatShading: true
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    function getTerrainY(x, z, t) {
        return Math.sin(x * 0.2 + t) * Math.cos(z * 0.2 + t) * 1.5;
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffccff, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);
    
    const pinkLight = new THREE.PointLight(0xff66b2, 2, 20);
    const blueLight = new THREE.PointLight(0x66b2ff, 2, 20);
    scene.add(pinkLight, blueLight);

    return {
        scene,
        camera,
        renderer,
        container,
        floorGeo,
        getTerrainY,
        pinkLight,
        blueLight
    };
}

