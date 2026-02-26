import * as THREE from 'three';

const NUM_CP = 7;

export function createDuckHug(scene, duckGroup) {
    const floatingHead = new THREE.Group();
    scene.add(floatingHead);
    floatingHead.visible = false;

    const matFeather = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4, metalness: 0.1 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });

    const fhHeadNew = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), matFeather);
    fhHeadNew.position.set(0, 1.1, 0.3);
    floatingHead.add(fhHeadNew);

    const fhBeakHeadGeo = new THREE.BoxGeometry(0.2, 0.15, 0.5);
    const fhBeakHeadPos = fhBeakHeadGeo.attributes.position;
    for (let i = 0; i < fhBeakHeadPos.count; i++) {
        if (fhBeakHeadPos.getZ(i) > 0) {
            fhBeakHeadPos.setX(i, fhBeakHeadPos.getX(i) * 0.5);
            fhBeakHeadPos.setY(i, fhBeakHeadPos.getY(i) * 0.5);
        }
    }
    fhBeakHeadGeo.computeVertexNormals();
    const fhBeakHeadMesh = new THREE.Mesh(fhBeakHeadGeo, beakMat);
    fhBeakHeadMesh.position.set(0, 1.1, 0.65);
    floatingHead.add(fhBeakHeadMesh);

    const neckCP = Array.from({ length: NUM_CP }, () => new THREE.Vector3());
    let tubeMesh = null;
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4, metalness: 0.2 });

    function rebuildTube(points) {
        if (tubeMesh) {
            scene.remove(tubeMesh);
            tubeMesh.geometry.dispose();
            tubeMesh = null;
        }
        const filtered = [];
        for (let i = 0; i < points.length; i++) {
            if (i === 0 || points[i].distanceTo(points[i - 1]) > 0.05) {
                filtered.push(points[i].clone());
            }
        }
        if (filtered.length < 2) return;
        if (filtered.length === 2) {
            filtered.splice(1, 0, new THREE.Vector3().lerpVectors(filtered[0], filtered[1], 0.5));
        }
        try {
            const curve = new THREE.CatmullRomCurve3(filtered, false, 'catmullrom', 0.5);
            const geo = new THREE.TubeGeometry(curve, filtered.length * 4, 0.32, 10, false);
            tubeMesh = new THREE.Mesh(geo, yellowMat);
            tubeMesh.castShadow = true;
            scene.add(tubeMesh);
        } catch (e) {
            // Ignore errors
        }
    }

    return {
        floatingHead,
        neckCP,
        rebuildTube,
        getTubeMesh: () => tubeMesh,
        setTubeMesh: (mesh) => { tubeMesh = mesh; }
    };
}

export function updateDuckHug(delta, isHugging, ghostGroup, duckGroup, duckHugData, scene) {
    const { floatingHead, neckCP, rebuildTube, getTubeMesh, setTubeMesh } = duckHugData;
    const up3 = new THREE.Vector3(0, 1, 0);

    if (isHugging) {
        const duckUserData = duckGroup.userData;
        if (!duckUserData || !duckUserData.bodyGroup) return;

        const neckBaseWorld = new THREE.Vector3();
        duckUserData.bodyGroup.getWorldPosition(neckBaseWorld);
        neckBaseWorld.y += 2.0;

        const gc = ghostGroup.position.clone();
        gc.y += 2.0;

        const toGN = new THREE.Vector3().subVectors(gc, neckBaseWorld).normalize();
        const right3 = new THREE.Vector3().crossVectors(up3, toGN);
        if (right3.lengthSq() < 0.001) right3.set(1, 0, 0);
        else right3.normalize();
        const wr = 1.4;

        const targets = [
            neckBaseWorld.clone(),
            neckBaseWorld.clone().lerp(gc, 0.25).addScaledVector(up3, 1.8),
            neckBaseWorld.clone().lerp(gc, 0.55).addScaledVector(up3, 0.4),
            gc.clone().addScaledVector(right3, wr),
            gc.clone().addScaledVector(toGN, wr),
            gc.clone().addScaledVector(right3, -wr),
            gc.clone().addScaledVector(toGN, -wr * 0.7).addScaledVector(up3, 1.0)
        ];

        const NECK_SPEED = 10;
        for (let i = 0; i < NUM_CP; i++) {
            neckCP[i].lerp(targets[i], NECK_SPEED * delta);
        }

        rebuildTube(neckCP);

        floatingHead.visible = true;
        if (duckUserData.neckGroup) {
            duckUserData.neckGroup.visible = false;
        }

        floatingHead.position.copy(neckCP[NUM_CP - 1]);
        const lastDir = new THREE.Vector3().subVectors(neckCP[NUM_CP - 1], neckCP[NUM_CP - 2]);
        if (lastDir.lengthSq() > 0.001) {
            const mat4 = new THREE.Matrix4().lookAt(new THREE.Vector3(), lastDir.normalize(), up3);
            floatingHead.quaternion.setFromRotationMatrix(mat4);
        }
    } else {
        const duckUserData = duckGroup.userData;
        if (!duckUserData || !duckUserData.bodyGroup) return;

        const neckBaseWorld = new THREE.Vector3();
        duckUserData.bodyGroup.getWorldPosition(neckBaseWorld);
        neckBaseWorld.y += 2.0;

        for (let i = 0; i < NUM_CP; i++) {
            neckCP[i].lerp(neckBaseWorld, 14 * delta);
        }

        floatingHead.visible = false;
        if (duckUserData.neckGroup) {
            duckUserData.neckGroup.visible = true;
        }

        const spread = neckCP[NUM_CP - 1].distanceTo(neckBaseWorld);
        if (spread > 0.4) {
            rebuildTube(neckCP);
        } else {
            const tubeMesh = getTubeMesh();
            if (tubeMesh) {
                scene.remove(tubeMesh);
                tubeMesh.geometry.dispose();
                setTubeMesh(null);
            }
        }
    }
}

