import * as THREE from 'three';

export function createScene() {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    // Enhanced fog for better distance-based visibility (objects fade into fog when far)
    // FogExp2: color, density (higher = more fog, objects fade faster)
    scene.fog = new THREE.FogExp2(0xffb6c1, 0.015); // Slightly increased density for better far-object fading

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    
    // Use WebGL renderer with performance optimizations
    // Keep antialias enabled for better visual quality (minimal performance impact)
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, // Keep enabled - disabling causes visual artifacts
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });
    renderer.setSize(innerWidth, innerHeight);
    // Cap pixel ratio at 1.5 for high-DPI displays (reduced for better performance)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Use BasicShadowMap for better performance (faster than PCFSoftShadowMap)
    // Reduce shadow map resolution for better performance
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.NoToneMapping; // Disable tone mapping for better performance
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    
    // Store renderer type for FPS counter (detect if WebGPU is available)
    renderer.isWebGPU = false; // WebGL for now
    if (navigator.gpu) {
        // WebGPU is available, but we're using WebGL for compatibility
        // You can implement async WebGPU initialization if needed
    }

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
    // Reduced shadow map resolution to 512 for better performance (significant boost)
    dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 512;
    // Reduce shadow camera frustum for better performance
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
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

