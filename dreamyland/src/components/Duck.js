import * as THREE from 'three';

export function createDuck(scene) {
    const duckGroup = new THREE.Group();
    duckGroup.position.set(5, 0, 5);
    scene.add(duckGroup);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.7 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.7, metalness: 0.2 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4, metalness: 0.2 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
    const matShirt = new THREE.MeshStandardMaterial({ color: 0xFFD150, roughness: 0.5 });
    const matTie = new THREE.MeshStandardMaterial({ color: 0xF8843F, roughness: 0.6 });
    const matFeather = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4, metalness: 0.1 });
    const matBlack = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const bodyGroup = new THREE.Group();
    duckGroup.add(bodyGroup);

    const legsGroup = new THREE.Group();
    legsGroup.position.set(0, 0, 0);
    duckGroup.add(legsGroup);

    // Suit Body
    const duckBodyGeo = new THREE.CapsuleGeometry(0.52, 0.8, 10, 10);
    const bodyMesh = new THREE.Mesh(duckBodyGeo, suitMat);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.position.y = 1.6;
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    // Tail
    const duckTailGeo = new THREE.ConeGeometry(0.4, 0.8, 14);
    const tailMesh = new THREE.Mesh(duckTailGeo, suitMat);
    tailMesh.rotation.x = -Math.PI / 2;
    tailMesh.position.set(0, 1.6, -0.8);
    tailMesh.castShadow = true;
    bodyGroup.add(tailMesh);

    // Vest
    const duckVestGeo = new THREE.BoxGeometry(0.50, 1, 0.3);
    const duckVestMesh = new THREE.Mesh(duckVestGeo, vestMat);
    duckVestMesh.position.set(0, 1.5, 0.5);
    duckVestMesh.castShadow = true;
    bodyGroup.add(duckVestMesh);

    // Shirt & Tie
    const duckShirtGeo = new THREE.PlaneGeometry(0.02, 0.02);
    const shirtMesh = new THREE.Mesh(duckShirtGeo, matShirt);
    shirtMesh.position.set(0, 1.7, 0.65);
    shirtMesh.rotation.x = -Math.PI / 6;
    bodyGroup.add(shirtMesh);

    const duckCollarGeo = new THREE.CylinderGeometry(0.2, 0.4, 0.2, 16);
    const collarMesh = new THREE.Mesh(duckCollarGeo, matShirt);
    collarMesh.position.set(0, 2.05, 0.5);
    collarMesh.rotation.x = Math.PI / 8;
    bodyGroup.add(collarMesh);

    const duckTieGeo = new THREE.BoxGeometry(0.15, 0.7, 0.05);
    const tieMesh = new THREE.Mesh(duckTieGeo, matTie);
    tieMesh.position.set(0, 1.5, 0.7);
    tieMesh.rotation.x = -Math.PI / 8;
    bodyGroup.add(tieMesh);

    // Neck & Head
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 2.0, 0.4);
    bodyGroup.add(neckGroup);

    const duckNeckGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.2, 16);
    const neckMesh = new THREE.Mesh(duckNeckGeo, matFeather);
    neckMesh.position.set(0, 0.5, 0.2);
    neckMesh.rotation.x = Math.PI / 12;
    neckMesh.castShadow = true;
    neckGroup.add(neckMesh);

    const duckHeadGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMesh = new THREE.Mesh(duckHeadGeo, matFeather);
    headMesh.position.set(0, 1.1, 0.3);
    headMesh.castShadow = true;
    neckGroup.add(headMesh);

    // Beak
    const duckBeakHeadGeo = new THREE.BoxGeometry(0.2, 0.15, 0.5);
    const beakHeadPos = duckBeakHeadGeo.attributes.position;
    for (let i = 0; i < beakHeadPos.count; i++) {
        if (beakHeadPos.getZ(i) > 0) {
            beakHeadPos.setX(i, beakHeadPos.getX(i) * 0.5);
            beakHeadPos.setY(i, beakHeadPos.getY(i) * 0.5);
        }
    }
    duckBeakHeadGeo.computeVertexNormals();
    const beakHeadMesh = new THREE.Mesh(duckBeakHeadGeo, beakMat);
    beakHeadMesh.position.set(0, 1.1, 0.65);
    beakHeadMesh.castShadow = true;
    neckGroup.add(beakHeadMesh);

    // Pixel Sunglasses
    const glassesGroup = new THREE.Group();
    const pixelSize = 0.04;
    const duckPixelGeo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);

    const lensPattern = [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0]
    ];

    const buildLens = (offsetX) => {
        for (let y = 0; y < lensPattern.length; y++) {
            for (let x = 0; x < lensPattern[y].length; x++) {
                if (lensPattern[y][x] === 1) {
                    const p = new THREE.Mesh(duckPixelGeo, matBlack);
                    p.position.set(
                        offsetX + (x * pixelSize) - (lensPattern[0].length * pixelSize / 2),
                        -y * pixelSize,
                        0
                    );
                    glassesGroup.add(p);
                }
            }
        }
    };

    buildLens(-0.15);
    buildLens(0.15);

    const duckBridgeGlasses = new THREE.Mesh(new THREE.BoxGeometry(0.1, pixelSize, pixelSize), matBlack);
    glassesGroup.add(duckBridgeGlasses);

    const duckArmGeoGlasses = new THREE.BoxGeometry(pixelSize * 0.7, pixelSize * 0.7, 0.3);
    const duckLeftArmGlasses = new THREE.Mesh(duckArmGeoGlasses, matBlack);
    duckLeftArmGlasses.position.set(-0.25, 0, -0.15);
    glassesGroup.add(duckLeftArmGlasses);

    const duckRightArmGlasses = new THREE.Mesh(duckArmGeoGlasses, matBlack);
    duckRightArmGlasses.position.set(0.25, 0, -0.15);
    glassesGroup.add(duckRightArmGlasses);

    glassesGroup.position.set(0, 1.30, 0.8);
    glassesGroup.rotation.x = Math.PI / 16;
    neckGroup.add(glassesGroup);

    // Legs
    const duckLegGeoNew = new THREE.CylinderGeometry(0.2, 0.15, 1.5, 16);
    const duckShoeGeoNew = new THREE.BoxGeometry(0.25, 0.15, 0.4);

    const createLeg = (xOffset) => {
        const leg = new THREE.Group();
        const pant = new THREE.Mesh(duckLegGeoNew, suitMat);
        pant.position.y = 0.7;
        pant.castShadow = true;
        leg.add(pant);

        const shoe = new THREE.Mesh(duckShoeGeoNew, yellowMat);
        shoe.position.set(0, 0.050, 0.2);
        shoe.castShadow = true;
        leg.add(shoe);

        leg.position.set(xOffset, 0, 0);
        return leg;
    };

    const leftLeg = createLeg(-0.3);
    const rightLeg = createLeg(0.3);
    legsGroup.add(leftLeg);
    legsGroup.add(rightLeg);

    duckGroup.userData = {
        bodyGroup,
        neckGroup,
        leftLeg,
        rightLeg
    };

    return duckGroup;
}

