import * as THREE from 'three';

export function setExpression(ghostGroup, exp, gameState = null) {
    const userData = ghostGroup.userData;
    if (!userData) return;
    
    // Update gameState if provided
    if (gameState) {
        gameState.currentExpression = exp;
    }

    const { leftEye, rightEye, mouth, tears, leftEyelash, rightEyelash } = userData;

    leftEye.rotation.z = Math.PI / 2;
    rightEye.rotation.z = Math.PI / 2;
    leftEye.scale.set(1, 1, 1);
    rightEye.scale.set(1, 1, 1);
    mouth.rotation.set(Math.PI, 0, 0);
    mouth.position.y = -0.1;
    tears.forEach(t => t.mesh.visible = false);

    if (exp === 'sad') {
        leftEye.rotation.z -= 0.2;
        rightEye.rotation.z += 0.2;
        mouth.rotation.x = 0;
        mouth.position.y = -0.2;
        leftEyelash.rotation.set(Math.PI / 2 + 0.3, 0, -Math.PI / 6 - 0.2);
        rightEyelash.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI / 6 + 0.2);
        leftEyelash.position.y = 0.35;
        rightEyelash.position.y = 0.35;
    } else if (exp === 'smile') {
        leftEye.scale.x = 0.2;
        rightEye.scale.x = 0.2;
        leftEyelash.rotation.set(Math.PI / 2 - 0.2, 0, -Math.PI / 6);
        rightEyelash.rotation.set(Math.PI / 2 - 0.2, 0, Math.PI / 6);
        leftEyelash.position.y = 0.45;
        rightEyelash.position.y = 0.45;
    } else if (exp === 'crying') {
        leftEye.rotation.z -= 0.3;
        rightEye.rotation.z += 0.3;
        mouth.rotation.x = 0;
        mouth.position.y = -0.2;
        tears.forEach(t => {
            t.mesh.visible = true;
            t.yOffset = Math.random() * 0.5;
        });
        leftEyelash.rotation.set(Math.PI / 2 + 0.4, 0, -Math.PI / 6 - 0.3);
        rightEyelash.rotation.set(Math.PI / 2 + 0.4, 0, Math.PI / 6 + 0.3);
        leftEyelash.position.y = 0.3;
        rightEyelash.position.y = 0.3;
    } else {
        // Neutral
        leftEyelash.rotation.set(Math.PI / 2, 0, -Math.PI / 6);
        rightEyelash.rotation.set(Math.PI / 2, 0, Math.PI / 6);
        leftEyelash.position.y = 0.4;
        rightEyelash.position.y = 0.4;
    }
}

