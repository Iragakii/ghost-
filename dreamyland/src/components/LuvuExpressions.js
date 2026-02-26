import * as THREE from 'three';

export function setExpression(luvuGroup, exp, gameState = null) {
    const userData = luvuGroup.userData;
    if (!userData) return;
    
    // Update gameState if provided
    if (gameState) {
        gameState.currentExpression = exp;
    }

    // Store target expression for smooth animation
    userData.targetExpression = exp;
    
    // Initialize target values if not exists
    if (!userData.targetEyeScale) {
        userData.targetEyeScale = { left: 1, right: 1 };
    }
    if (!userData.targetEyePosition) {
        userData.targetEyePosition = { left: { y: 0 }, right: { y: 0 } };
    }
    if (!userData.targetHandRotation) {
        userData.targetHandRotation = { left: { z: 0 }, right: { z: 0 } };
    }
    if (!userData.targetBodyRotation) {
        userData.targetBodyRotation = { z: 0 };
    }

    const { leftEye, rightEye, leftHand, rightHand, silkBody } = userData;
    
    if (!leftEye || !rightEye || !leftHand || !rightHand || !silkBody) {
        return; // Model not loaded yet
    }

    // Set target values based on expression
    if (exp === 'angry') {
        // 😠 Angry: eyes narrow, hands clenched
        userData.targetEyeScale.left = 10;
        userData.targetEyeScale.right = 10;
        userData.targetHandRotation.left.z = 0.5;
        userData.targetHandRotation.right.z = -0.5;
        userData.targetBodyRotation.z = 0; // No side lean allowed
        
        // Show "O" mouth for angry emotion
        if (userData.mouthO) {
            userData.mouthO.visible = true;
        }
        // Hide regular mouth
        if (userData.mouth) {
            userData.mouth.visible = false;
        }
    } else if (exp === 'cry' || exp === 'crying') {
        // 😭 Cry: eyes closed (scale X axis like old code), move down, hands up, tears visible
        userData.targetEyeScale.left = 0.1; // Scale X axis down (close eyes horizontally like old code)
        userData.targetEyeScale.right = 0.1;
        userData.targetEyePosition.left.y = -0.1; // Move eyes down when crying
        userData.targetEyePosition.right.y = -0.1;
        userData.targetHandRotation.left.z = 0.8;
        userData.targetHandRotation.right.z = -0.8;
        userData.targetBodyRotation.z = 0; // No side lean allowed
        
        // Show mouth when crying
        if (userData.mouth) {
            userData.mouth.visible = true;
        }
        // Hide "O" mouth
        if (userData.mouthO) {
            userData.mouthO.visible = false;
        }
        
        // Show tears and randomize their starting positions
        if (userData.tears) {
            userData.tears.forEach(t => {
                t.mesh.visible = true;
                t.yOffset = Math.random() * 0.5; // Random starting position
            });
        }
    } else if (exp === 'sad' || exp === 'neutral') {
        // 😔 Sad/Neutral: eyes back to default, hide tears
        userData.targetEyeScale.left = 1;
        userData.targetEyeScale.right = 1;
        userData.targetEyePosition.left.y = 0; // Reset eye position
        userData.targetEyePosition.right.y = 0;
        userData.targetHandRotation.left.z = 0;
        userData.targetHandRotation.right.z = 0;
        userData.targetBodyRotation.z = 0;
        
        // Hide mouth when not crying
        if (userData.mouth) {
            userData.mouth.visible = false;
        }
        // Hide "O" mouth
        if (userData.mouthO) {
            userData.mouthO.visible = false;
        }
        
        // Hide tears
        if (userData.tears) {
            userData.tears.forEach(t => {
                t.mesh.visible = false;
            });
        }
    } else if (exp === 'smile') {
        // 😊 Smile: eyes squish (happy curve), hide tears
        userData.targetEyeScale.left = 1;
        userData.targetEyeScale.right = 1;
        userData.targetEyePosition.left.y = 0; // Reset eye position
        userData.targetEyePosition.right.y = 0;
        userData.targetHandRotation.left.z = 0;
        userData.targetHandRotation.right.z = 0;
        userData.targetBodyRotation.z = 0;
        
        // Hide tears
        if (userData.tears) {
            userData.tears.forEach(t => {
                t.mesh.visible = false;
            });
        }
    } else {
        // Default/neutral, hide tears - reset eyes to default
        userData.targetEyeScale.left = 1;
        userData.targetEyeScale.right = 1;
        userData.targetEyePosition.left.y = 0; // Reset eye position
        userData.targetEyePosition.right.y = 0;
        userData.targetHandRotation.left.z = 0;
        userData.targetHandRotation.right.z = 0;
        userData.targetBodyRotation.z = 0;
        
        // Hide mouth when not crying
        if (userData.mouth) {
            userData.mouth.visible = false;
        }
        // Hide "O" mouth
        if (userData.mouthO) {
            userData.mouthO.visible = false;
        }
        
        // Hide tears
        if (userData.tears) {
            userData.tears.forEach(t => {
                t.mesh.visible = false;
            });
        }
    }
}

// Update expression animations smoothly (call this in game loop)
export function updateExpressionAnimation(luvuGroup, delta, isMoving = false, isJumping = false) {
    const userData = luvuGroup.userData;
    if (!userData || !userData.targetExpression) return;
    
    const { leftEye, rightEye, leftHand, rightHand, silkBody, mouth, mouthO, modelGroup } = userData;
    if (!leftHand || !rightHand || !silkBody) return;
    
    if (!userData.targetEyeScale || !userData.targetHandRotation || !userData.targetBodyRotation) {
        return;
    }
    
    // Animate eyes based on expression (only when not moving/jumping)
    if (!isMoving && !isJumping && leftEye && rightEye) {
        // Apply eye scale animation for expressions (smoothly like old code)
        const eyeScaleSpeed = 4;
        if (userData.targetEyeScale) {
            // Scale X axis for crying (like old code does for smile/crying)
            // Smoothly lerp to target scale
            leftEye.scale.x = THREE.MathUtils.lerp(leftEye.scale.x, userData.targetEyeScale.left, eyeScaleSpeed * delta);
            rightEye.scale.x = THREE.MathUtils.lerp(rightEye.scale.x, userData.targetEyeScale.right, eyeScaleSpeed * delta);
            // Keep Y and Z scale at 1 (only X axis scales for crying)
            leftEye.scale.y = 1;
            leftEye.scale.z = 1;
            rightEye.scale.y = 1;
            rightEye.scale.z = 1;
        }
        
        // Apply eye position animation (move down when crying)
        if (userData.targetEyePosition && userData.leftEyeOriginalPos && userData.rightEyeOriginalPos) {
            const eyePosSpeed = 8;
            const targetLeftY = userData.leftEyeOriginalPos.y + (userData.targetEyePosition.left.y || 0);
            const targetRightY = userData.rightEyeOriginalPos.y + (userData.targetEyePosition.right.y || 0);
            
            leftEye.position.y = THREE.MathUtils.lerp(leftEye.position.y, targetLeftY, eyePosSpeed * delta);
            rightEye.position.y = THREE.MathUtils.lerp(rightEye.position.y, targetRightY, eyePosSpeed * delta);
            
            // Keep X and Z at original positions
            leftEye.position.x = userData.leftEyeOriginalPos.x;
            leftEye.position.z = userData.leftEyeOriginalPos.z;
            rightEye.position.x = userData.rightEyeOriginalPos.x;
            rightEye.position.z = userData.rightEyeOriginalPos.z;
        }
        if (userData.targetExpression === 'angry') {
            // Eyes rotate slightly when crying (left eye rotates left, right eye rotates right)
            const cryRotationSpeed = 10;
            leftEye.rotation.z = THREE.MathUtils.lerp(leftEye.rotation.z, -0.3, cryRotationSpeed * delta);
            rightEye.rotation.z = THREE.MathUtils.lerp(rightEye.rotation.z, 0.3, cryRotationSpeed * delta);
        }
        // Apply eye rotation for crying expression (like old ghost code)
        if (userData.targetExpression === 'cry' || userData.targetExpression === 'crying') {
            // Eyes rotate slightly when crying (left eye rotates left, right eye rotates right)
            const cryRotationSpeed = 4;
            leftEye.rotation.z = THREE.MathUtils.lerp(leftEye.rotation.z, -0.3, cryRotationSpeed * delta);
            rightEye.rotation.z = THREE.MathUtils.lerp(rightEye.rotation.z, 0.3, cryRotationSpeed * delta);
        } else {
            // Reset eye rotation to original when not crying (force reset to default)
            const resetSpeed = 5 // Faster reset
            if (userData.originalRotations && userData.originalRotations.leftEye) {
                leftEye.rotation.z = THREE.MathUtils.lerp(leftEye.rotation.z, userData.originalRotations.leftEye.z, resetSpeed * delta);
            } else {
                leftEye.rotation.z = THREE.MathUtils.lerp(leftEye.rotation.z, 0, resetSpeed * delta);
            }
            if (userData.originalRotations && userData.originalRotations.rightEye) {
                rightEye.rotation.z = THREE.MathUtils.lerp(rightEye.rotation.z, userData.originalRotations.rightEye.z, resetSpeed * delta);
            } else {
                rightEye.rotation.z = THREE.MathUtils.lerp(rightEye.rotation.z, 0, resetSpeed * delta);
            }
        }
    } else {
        // When moving/jumping, keep eyes at default
        if (leftEye && userData.leftEyeOriginalPos) {
            leftEye.position.copy(userData.leftEyeOriginalPos);
            leftEye.scale.set(1, 1, 1);
            if (leftEye.rotation && userData.originalRotations && userData.originalRotations.leftEye) {
                leftEye.rotation.copy(userData.originalRotations.leftEye);
            } else if (leftEye.rotation) {
                leftEye.rotation.set(0, 0, 0);
            }
        }
        if (rightEye && userData.rightEyeOriginalPos) {
            rightEye.position.copy(userData.rightEyeOriginalPos);
            rightEye.scale.set(1, 1, 1);
            if (rightEye.rotation && userData.originalRotations && userData.originalRotations.rightEye) {
                rightEye.rotation.copy(userData.originalRotations.rightEye);
            } else if (rightEye.rotation) {
                rightEye.rotation.set(0, 0, 0);
            }
        }
    }
    
    // Smoothly lerp hand rotation (always, even during movement)
    const handLerpSpeed = 8;
    leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, userData.targetHandRotation.left.z, handLerpSpeed * delta);
    rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, userData.targetHandRotation.right.z, handLerpSpeed * delta);
    
    // Rotate mouth based on modelGroup.rotation.y (like the image shows)
    if (mouth && modelGroup && userData.mouthOriginalRot) {
        // Rotate mouth to match modelGroup rotation
        // When modelGroup.rotation.y = Math.PI, mouth should rotate accordingly
        mouth.rotation.y = modelGroup.rotation.y;
        // Keep original X and Z rotations
        mouth.rotation.x = userData.mouthOriginalRot.x;
        mouth.rotation.z = userData.mouthOriginalRot.z;
    }
    
    // Rotate "O" mouth based on modelGroup.rotation.y for angry emotion
    if (mouthO && modelGroup && userData.mouthOOriginalRot) {
        // Rotate "O" mouth to match modelGroup rotation
        // When modelGroup.rotation.y = Math.PI, "O" mouth should rotate accordingly
        mouthO.rotation.y = modelGroup.rotation.y;
        // Keep original X and Z rotations
        mouthO.rotation.x = userData.mouthOOriginalRot.x;
        mouthO.rotation.z = userData.mouthOOriginalRot.z;
    }
    
    // Don't apply body rotation.z from expressions - only forward lean is allowed
    // Side lean (rotation.z) is always kept at 0 in Game.js
}

