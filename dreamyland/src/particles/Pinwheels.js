import * as THREE from 'three';

export function createPinwheels(scene) {
    const pinwheelCount = 400;
    const pinwheelColors = [0xff4081, 0xffeb3b, 0x4caf50, 0x2196f3];

    const bladeGeo = new THREE.PlaneGeometry(0.6, 0.6, 4, 4);
    bladeGeo.translate(0.3, 0.3, 0);
    const bladePos = bladeGeo.attributes.position;
    for (let i = 0; i < bladePos.count; i++) {
        let x = bladePos.getX(i);
        let y = bladePos.getY(i);
        let z = (x * y) * 0.4;
        bladePos.setZ(i, z);
    }
    bladeGeo.computeVertexNormals();
    bladeGeo.rotateX(0.2);

    const pinwheelBlades = [];
    for (let i = 0; i < 4; i++) {
        const mat = new THREE.MeshStandardMaterial({
            color: pinwheelColors[i],
            side: THREE.DoubleSide,
            roughness: 0.2,
            metalness: 0.1
        });
        const mesh = new THREE.InstancedMesh(bladeGeo, mat, pinwheelCount);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        pinwheelBlades.push(mesh);
    }

    const pinwheelHubGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const pinwheelHubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const pinwheelHubs = new THREE.InstancedMesh(pinwheelHubGeo, pinwheelHubMat, pinwheelCount);
    scene.add(pinwheelHubs);

    const pinwheelPositions = new Float32Array(pinwheelCount * 3);
    const pinwheelPhases = new Float32Array(pinwheelCount);
    const pinwheelSpeeds = new Float32Array(pinwheelCount);
    const pinwheelSpinSpeeds = new Float32Array(pinwheelCount);
    const pinwheelOrientations = new Float32Array(pinwheelCount * 3);

    for (let i = 0; i < pinwheelCount; i++) {
        const isLeft = Math.random() > 0.5;
        pinwheelPositions[i * 3] = isLeft ? (Math.random() * -20 - 40) : (Math.random() * 20 + 40);
        pinwheelPositions[i * 3 + 1] = Math.random() * 30 + 2;
        pinwheelPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
        pinwheelPhases[i] = Math.random() * Math.PI * 2;
        pinwheelSpeeds[i] = Math.random() * 0.4 + 0.1;
        pinwheelSpinSpeeds[i] = Math.random() * 8 + 4;
        pinwheelOrientations[i * 3] = (Math.random() - 0.5) * Math.PI * 0.5;
        pinwheelOrientations[i * 3 + 1] = Math.random() * Math.PI * 2;
        pinwheelOrientations[i * 3 + 2] = (Math.random() - 0.5) * Math.PI * 0.5;
    }

    // Reusable objects (never allocate in update loop)
    const pwDummy = new THREE.Object3D();
    const pwBladeDummy = new THREE.Object3D();
    
    return {
        update: (delta, time) => {

            for (let i = 0; i < pinwheelCount; i++) {
                const x = pinwheelPositions[i * 3] + Math.sin(time * 0.2 + pinwheelPhases[i]) * 2;
                const y = pinwheelPositions[i * 3 + 1] + Math.sin(time * pinwheelSpeeds[i] + pinwheelPhases[i]) * 1.5;
                const z = pinwheelPositions[i * 3 + 2] + Math.cos(time * 0.2 + pinwheelPhases[i]) * 2;

                pwDummy.position.set(x, y, z);
                pwDummy.rotation.set(pinwheelOrientations[i * 3], pinwheelOrientations[i * 3 + 1], pinwheelOrientations[i * 3 + 2]);
                pwDummy.updateMatrix();
                pinwheelHubs.setMatrixAt(i, pwDummy.matrix);

                const spin = time * pinwheelSpinSpeeds[i];
                for (let j = 0; j < 4; j++) {
                    pwBladeDummy.copy(pwDummy);
                    pwBladeDummy.rotateZ(spin + (j * Math.PI / 2));
                    pwBladeDummy.updateMatrix();
                    pinwheelBlades[j].setMatrixAt(i, pwBladeDummy.matrix);
                }
            }

            pinwheelHubs.instanceMatrix.needsUpdate = true;
            for (let j = 0; j < 4; j++) {
                pinwheelBlades[j].instanceMatrix.needsUpdate = true;
            }
        }
    };
}

