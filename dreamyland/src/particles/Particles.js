import * as THREE from 'three';

export function createParticles(scene) {
    // Basic particles
    const pCount = 10000;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = [];
    
    for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 600;
        pPos[i * 3 + 1] = Math.random() * 100;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 600;
        pVel.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    }));
    scene.add(particles);

    // Flower particles
    const flowerParticleCount = 150;
    const flowerColors = [0xff1493, 0xff69b4, 0xffb6c1, 0xffc0cb, 0xff00ff, 0xee82ee, 0xda70d6, 0xba55d3, 0x9370db, 0xff6347, 0xffa500, 0xffd700];
    const flowerGroup = new THREE.Group();
    scene.add(flowerGroup);

    const flowerMeshes = [];
    for (let i = 0; i < flowerParticleCount; i++) {
        const flowerGeoInstance = new THREE.IcosahedronGeometry(0.15, 2);
        const colorHex = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        const flowerMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.8,
            emissive: colorHex,
            emissiveIntensity: 0.5,
            roughness: 0.4
        });
        const flowerMesh = new THREE.Mesh(flowerGeoInstance, flowerMat);
        flowerMesh.visible = false;
        flowerGroup.add(flowerMesh);
        flowerMeshes.push({
            mesh: flowerMesh,
            life: 2.0,
            maxLife: 1.0,
            velocity: new THREE.Vector3(0, 0, 0),
            colorIntensity: 1.0
        });
    }

    let flowerParticleIndex = 0;
    function spawnFlowerParticle(pos, vel, life = 1.0) {
        const idx = flowerParticleIndex % flowerParticleCount;
        const flower = flowerMeshes[idx];
        flower.mesh.position.copy(pos);
        flower.mesh.visible = true;
        flower.velocity.copy(vel);
        flower.life = 0;
        flower.maxLife = life;
        flower.mesh.scale.setScalar(1);
        flowerParticleIndex++;
    }

    // Wind stream particles
    const windStreamCount = 300;
    const windStreamGeo = new THREE.BufferGeometry();
    const windStreamPos = new Float32Array(windStreamCount * 6);
    const windStreamVel = [];
    const windStreamLife = [];
    const windStreamMaxLife = [];

    for (let i = 0; i < windStreamCount; i++) {
        windStreamPos[i * 6] = 0;
        windStreamPos[i * 6 + 1] = 0;
        windStreamPos[i * 6 + 2] = 0;
        windStreamPos[i * 6 + 3] = 0;
        windStreamPos[i * 6 + 4] = 0;
        windStreamPos[i * 6 + 5] = 0;
        windStreamVel.push({ x: 0, y: 0, z: 0, dirX: 0, dirY: 0, dirZ: 0, trailLen: 1 });
        windStreamLife.push(2.0);
        windStreamMaxLife.push(1);
    }
    windStreamGeo.setAttribute('position', new THREE.BufferAttribute(windStreamPos, 3));

    const windStreamParticles = new THREE.LineSegments(windStreamGeo, new THREE.LineBasicMaterial({
        color: new THREE.Color(0xA82323),
        transparent: true,
        opacity: 1.0,
        linewidth: 4,
        blending: THREE.NormalBlending,
        fog: false,
        toneMapped: false,
        depthWrite: true
    }));
    windStreamParticles.frustumCulled = false;
    scene.add(windStreamParticles);

    let windParticleIndex = 0;
    let lastWindStreamTime = 0;
    
    function spawnWindStream(pos, direction, speed, life = 0.6) {
        const idx = windParticleIndex % windStreamCount;
        const trailLen = 2.5 + Math.random() * 1.0;
        windStreamPos[idx * 6] = pos.x;
        windStreamPos[idx * 6 + 1] = pos.y;
        windStreamPos[idx * 6 + 2] = pos.z;
        windStreamPos[idx * 6 + 3] = pos.x + direction.x * speed * trailLen;
        windStreamPos[idx * 6 + 4] = pos.y + direction.y * speed * trailLen;
        windStreamPos[idx * 6 + 5] = pos.z + direction.z * speed * trailLen;
        windStreamVel[idx] = {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            dirX: direction.x * speed,
            dirY: direction.y * speed,
            dirZ: direction.z * speed,
            trailLen: trailLen
        };
        windStreamLife[idx] = 0;
        windStreamMaxLife[idx] = life;
        windParticleIndex++;
    }

    return {
        particles,
        pPos,
        pVel,
        pCount,
        flowerMeshes,
        flowerParticleCount,
        spawnFlowerParticle,
        spawnFlowerParticles: (pos, moveVel) => {
            for (let p = 0; p < 2; p++) {
                const randomVel = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 4 + 2,
                    (Math.random() - 0.5) * 8
                );
                const spawnPos = pos.clone().add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2
                    )
                );
                const finalVel = moveVel.clone().multiplyScalar(0.2).add(randomVel);
                spawnFlowerParticle(spawnPos, finalVel, 1.0 + Math.random() * 0.5);
            }
        },
        spawnWindStreams: (ghostPos, ghostVel, time) => {
            if (time - lastWindStreamTime > 0.2) {
                const actualMoveDir = new THREE.Vector3(ghostVel.x, 0, ghostVel.z).normalize();
                const rightDir = new THREE.Vector3(-actualMoveDir.z, 0, actualMoveDir.x).normalize();
                const upDir = new THREE.Vector3(0, 1, 0);
                const windParallelDir = actualMoveDir.clone().multiplyScalar(-1).normalize();
                const SPEED = 30;

                const posCenter = ghostPos.clone().add(actualMoveDir.clone().multiplyScalar(5)).add(
                    new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.3)
                );
                spawnWindStream(posCenter, windParallelDir, SPEED * 1.5, 0.1);
                lastWindStreamTime = time;
            }
        },
        update: (delta, time) => {
            // Update basic particles
            for (let i = 0; i < pCount; i++) {
                pPos[i * 3] += pVel[i].x;
                pPos[i * 3 + 1] += pVel[i].y;
                pPos[i * 3 + 2] += pVel[i].z;
                if (pPos[i * 3 + 1] > 100) pPos[i * 3 + 1] = 0;
                if (pPos[i * 3 + 1] < 0) pPos[i * 3 + 1] = 100;
                if (pPos[i * 3] > 300) pPos[i * 3] = -300;
                if (pPos[i * 3] < -300) pPos[i * 3] = 300;
                if (pPos[i * 3 + 2] > 300) pPos[i * 3 + 2] = -300;
                if (pPos[i * 3 + 2] < -300) pPos[i * 3 + 2] = 300;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Update flower particles
            for (let i = 0; i < flowerParticleCount; i++) {
                const flower = flowerMeshes[i];
                flower.life += delta / flower.maxLife;
                if (flower.life < 1.0) {
                    flower.mesh.position.x += flower.velocity.x * delta;
                    flower.mesh.position.y += flower.velocity.y * delta;
                    flower.mesh.position.z += flower.velocity.z * delta;
                    flower.velocity.y -= 6 * delta;
                    flower.velocity.x *= (1 - delta * 0.4);
                    flower.velocity.z *= (1 - delta * 0.4);
                    flower.mesh.rotation.x += delta * 2;
                    flower.mesh.rotation.y += delta * 3;
                    const fadeAlpha = 1.0 - flower.life;
                    flower.mesh.material.opacity = 0.8 * fadeAlpha;
                    flower.mesh.material.emissiveIntensity = 0.5 * fadeAlpha;
                    flower.mesh.scale.setScalar(fadeAlpha);
                } else {
                    flower.mesh.visible = false;
                }
            }

            // Update wind streams
            for (let i = 0; i < windStreamCount; i++) {
                windStreamLife[i] += delta / windStreamMaxLife[i];
                if (windStreamLife[i] < 1.0) {
                    const moveX = windStreamVel[i].dirX * delta * 12;
                    const moveY = windStreamVel[i].dirY * delta * 12;
                    const moveZ = windStreamVel[i].dirZ * delta * 12;
                    windStreamPos[i * 6] += moveX;
                    windStreamPos[i * 6 + 1] += moveY;
                    windStreamPos[i * 6 + 2] += moveZ;
                    windStreamPos[i * 6 + 3] = windStreamPos[i * 6] + windStreamVel[i].dirX * windStreamVel[i].trailLen * 0.15;
                    windStreamPos[i * 6 + 4] = windStreamPos[i * 6 + 1] + windStreamVel[i].dirY * windStreamVel[i].trailLen * 0.15;
                    windStreamPos[i * 6 + 5] = windStreamPos[i * 6 + 2] + windStreamVel[i].dirZ * windStreamVel[i].trailLen * 0.15;
                } else {
                    windStreamPos[i * 6] = 0;
                    windStreamPos[i * 6 + 1] = 0;
                    windStreamPos[i * 6 + 2] = 0;
                    windStreamPos[i * 6 + 3] = 0;
                    windStreamPos[i * 6 + 4] = 0;
                    windStreamPos[i * 6 + 5] = 0;
                }
            }
            windStreamParticles.geometry.attributes.position.needsUpdate = true;
        }
    };
}

