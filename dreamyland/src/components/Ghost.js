import * as THREE from 'three';

export function createGhost(scene) {
    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);

    const ghostMat = new THREE.MeshStandardMaterial({ color: 0xF2AEBB, roughness: 0.4 });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff6699, transparent: true, opacity: 0.5 });

    const bodyGeo = new THREE.CapsuleGeometry(1.2, 2, 20, 20);
    {
        const pos = bodyGeo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            if (v.y < -0.1) {
                const a = Math.atan2(v.z, v.x);
                const r = Math.sqrt(v.x * v.x + v.z * v.z);
                v.y += Math.sin(a * 6) * 0.9 * (1 - r / 1.2);
                pos.setXYZ(i, v.x, v.y, v.z);
            }
        }
        pos.needsUpdate = true;
        bodyGeo.computeVertexNormals();
    }
    bodyGeo.computeBoundingBox();
    const bottomOffset = -bodyGeo.boundingBox.min.y;

    const ghostBody = new THREE.Mesh(bodyGeo, ghostMat);
    ghostBody.castShadow = true;
    ghostGroup.add(ghostBody);

    const armGeo = new THREE.CapsuleGeometry(0.25, 0.8, 16, 16);
    const leftArm = new THREE.Mesh(armGeo, ghostMat);
    leftArm.position.set(-1.3, 0.2, 0.5);
    leftArm.rotation.set(Math.PI / 4, 0, -Math.PI / 6);
    leftArm.castShadow = true;
    ghostBody.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, ghostMat);
    rightArm.position.set(1.3, 0.2, 0.5);
    rightArm.rotation.set(Math.PI / 4, 0, Math.PI / 6);
    rightArm.castShadow = true;
    ghostBody.add(rightArm);

    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.5, 1.15);
    ghostBody.add(faceGroup);

    const eyeGeo = new THREE.CapsuleGeometry(0.1, 0.15, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, blackMat);
    leftEye.position.set(-0.4, 0.2, 0);
    leftEye.rotation.z = Math.PI / 2;
    faceGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, blackMat);
    rightEye.position.set(0.4, 0.2, 0);
    rightEye.rotation.z = Math.PI / 2;
    faceGroup.add(rightEye);

    // Eyelashes
    const leftEyelashGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.25, 8);
    const leftEyelash = new THREE.Mesh(leftEyelashGeo, blackMat);
    leftEyelash.position.set(-0.4, 0.4, 0.05);
    leftEyelash.rotation.set(Math.PI / 2, 0, -Math.PI / 6);
    leftEyelash.scale.set(1.5, 1.5, 1.2);
    faceGroup.add(leftEyelash);

    const rightEyelashGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.25, 8);
    const rightEyelash = new THREE.Mesh(rightEyelashGeo, blackMat);
    rightEyelash.position.set(0.4, 0.4, 0.05);
    rightEyelash.rotation.set(Math.PI / 2, 0, Math.PI / 6);
    rightEyelash.scale.set(1.5, 1.5, 1.2);
    faceGroup.add(rightEyelash);

    const blushGeo = new THREE.CircleGeometry(0.2, 32);
    const lb = new THREE.Mesh(blushGeo, blushMat);
    lb.position.set(-0.6, -0.1, 0.05);
    lb.rotation.y = -0.2;
    faceGroup.add(lb);

    const rb2 = new THREE.Mesh(blushGeo, blushMat);
    rb2.position.set(0.6, -0.1, 0.05);
    rb2.rotation.y = 0.2;
    faceGroup.add(rb2);

    const mouthGeo = new THREE.TorusGeometry(0.15, 0.04, 16, 32, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, blackMat);
    mouth.position.set(0, -0.1, 0.05);
    mouth.rotation.x = Math.PI;
    faceGroup.add(mouth);

    const tearGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const tearMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, transparent: true, opacity: 0.8 });
    const tears = [];
    for (let i = 0; i < 4; i++) {
        const t = new THREE.Mesh(tearGeo, tearMat);
        t.visible = false;
        faceGroup.add(t);
        tears.push({ mesh: t, yOffset: 0, isLeft: i % 2 === 0 });
    }

    // Store references for expression control
    ghostGroup.userData = {
        leftEye,
        rightEye,
        mouth,
        tears,
        leftEyelash,
        rightEyelash,
        leftArm,
        rightArm,
        ghostBody,
        bottomOffset
    };

    return ghostGroup;
}

