import * as THREE from 'three';

const INTERACTION_DISTANCE = 8;

// Character messages
const newCharMessages = [
    "You should Do my prompt better .........",
    "You should ... Fix line 52 to margin 0 for me -.-''",
    "You should Clean .. blah #lah bl#h ...",
    "Or i will find another better model ...."
];

const fatMessages = [
    "You shuold sing well like her",
    "You must always be nice infront of camera",
    "Getting closer and more fan like her",
    "Or i will find some girl replace you in bands."
];

const lmMessages = [
    "Do u want join some party with ....",
    "U can meet alot of .....",
    "Some drink will make u happy and sing better ..."
];

// State for message rotation
let currentMessageIndex = 0;
let lastMessageChangeTime = 0;
let fatCurrentMessageIndex = 0;
let fatLastMessageChangeTime = 0;
let lmCurrentMessageIndex = 0;
let lmLastMessageChangeTime = 0;

function getCharId(index) {
    const charMap = {
        0: 'char1',
        1: 'char2',
        2: 'char3',
        3: 'f',
        5: 'angle',
        6: 've',
        7: 'pp',
        8: 'lm',
        9: 'fat',
        10: 'lotus',
        11: 'daisy',
        12: 'lotus2',
        13: 'threlef',
        14: 'pinkf',
        15: 'lotus3'
    };
    return charMap[index] || `char${index + 1}`;
}

export function updateCharacterInteractions(camera, gameState, luvuGroup, characterModels, characterTimeouts, newCharacterGroup, time) {
    gameState.closestCharIndex = -1;
    let minDistance = INTERACTION_DISTANCE;

    // Update main characters
    for (let i = 0; i < characterModels.length; i++) {
        const char = characterModels[i];
        if (!char || !char.group) continue;

        const charPos = new THREE.Vector3();
        char.group.getWorldPosition(charPos);
        const distance = luvuGroup.position.distanceTo(charPos);
        const charId = getCharId(i);
        const notifEl = document.getElementById(`${charId}-notif`);
        const chatEl = document.getElementById(`${charId}-chat`);

        const headPos = charPos.clone();
        headPos.y += 3;
        const screenPos = headPos.clone().project(camera);
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        if (distance < INTERACTION_DISTANCE) {
            if (distance < minDistance) {
                minDistance = distance;
                gameState.closestCharIndex = i;
            }

            if (!char.isInteracting && notifEl && i !== 8 && i !== 9) {
                if (screenPos.x >= -1 && screenPos.x <= 1 &&
                    screenPos.y >= -1 && screenPos.y <= 1 &&
                    screenPos.z < 1 && screenPos.z > -1) {
                    notifEl.style.display = 'block';
                    notifEl.style.left = x + 'px';
                    if (i === 3 || i === 5 || i === 6 || i === 7) {
                        notifEl.style.top = (y - 180) + 'px';
                    } else {
                        notifEl.style.top = (y - 40) + 'px';
                    }
                    notifEl.style.transform = 'translateX(-50%)';
                } else {
                    notifEl.style.display = 'none';
                }
            }

            // Q notification for angle.glb
            if (i === 5 && !char.isInteracting) {
                const qNotifEl = document.getElementById('angle-q-notif');
                if (qNotifEl) {
                    if (screenPos.x >= -1 && screenPos.x <= 1 &&
                        screenPos.y >= -1 && screenPos.y <= 1 &&
                        screenPos.z < 1 && screenPos.z > -1) {
                        qNotifEl.style.display = 'block';
                        qNotifEl.style.left = (x + 60) + 'px';
                        qNotifEl.style.top = (y - 180) + 'px';
                        qNotifEl.style.transform = 'translateX(-50%)';
                    } else {
                        qNotifEl.style.display = 'none';
                    }
                }
            } else {
                const qNotifEl = document.getElementById('angle-q-notif');
                if (qNotifEl) {
                    qNotifEl.style.display = 'none';
                }
            }

            if (char.isInteracting && chatEl && i !== 8 && i !== 9) {
                chatEl.style.display = 'block';
                chatEl.style.left = x + 'px';
                if (i == 3 || i === 5 || i === 6 || i === 7) {
                    chatEl.style.top = (y - 160) + 'px';
                } else {
                    chatEl.style.top = (y - 60) + 'px';
                }
                chatEl.style.transform = 'translateX(-50%)';
            }
        } else {
            if (notifEl) notifEl.style.display = 'none';
            if (chatEl) chatEl.style.display = 'none';
            if (i === 5) {
                const qNotifEl = document.getElementById('angle-q-notif');
                if (qNotifEl) {
                    qNotifEl.style.display = 'none';
                }
            }
            if (char.isInteracting) {
                char.isInteracting = false;
                if (characterTimeouts[i]) {
                    clearTimeout(characterTimeouts[i]);
                    characterTimeouts[i] = null;
                }
            }
        }
    }

    // Hide notifications for non-closest characters
    for (let i = 0; i < characterModels.length; i++) {
        if (i !== gameState.closestCharIndex) {
            const char = characterModels[i];
            if (char) {
                const notifEl = document.getElementById(`char${i + 1}-notif`);
                const chatEl = document.getElementById(`char${i + 1}-chat`);
                if (notifEl) notifEl.style.display = 'none';
                if (chatEl) chatEl.style.display = 'none';
                if (i === 5) {
                    const qNotifEl = document.getElementById('angle-q-notif');
                    if (qNotifEl) {
                        qNotifEl.style.display = 'none';
                    }
                }
                if (char.isInteracting) {
                    char.isInteracting = false;
                    if (characterTimeouts[i]) {
                        clearTimeout(characterTimeouts[i]);
                        characterTimeouts[i] = null;
                    }
                }
            }
        }
    }

    // New character interaction
    gameState.isNewCharClose = false;
    if (newCharacterGroup && gameState.closestCharIndex < 0) {
        const charPos = new THREE.Vector3();
        newCharacterGroup.getWorldPosition(charPos);
        const distanceToGhost = luvuGroup.position.distanceTo(charPos);

        if (distanceToGhost < INTERACTION_DISTANCE) {
            gameState.isNewCharClose = true;
            const notifEl = document.getElementById('newchar-notif');
            if (notifEl) {
                const headPos = charPos.clone();
                headPos.y += 3;
                const screenPos = headPos.clone().project(camera);
                if (screenPos.x >= -1 && screenPos.x <= 1 &&
                    screenPos.y >= -1 && screenPos.y <= 1 &&
                    screenPos.z < 1 && screenPos.z > -1) {
                    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                    notifEl.style.left = x + 'px';
                    notifEl.style.top = (y - 100) + 'px';
                    notifEl.style.transform = 'translateX(-50%)';
                    notifEl.style.display = 'block';
                } else {
                    notifEl.style.display = 'none';
                }
            }
        } else {
            const notifEl = document.getElementById('newchar-notif');
            if (notifEl) {
                notifEl.style.display = 'none';
            }
        }
    } else {
        const notifEl = document.getElementById('newchar-notif');
        if (notifEl) {
            notifEl.style.display = 'none';
        }
    }

    // New character chat
    if (newCharacterGroup) {
        const chatEl = document.getElementById('newchar-chat');
        if (chatEl) {
            const charPos = new THREE.Vector3();
            newCharacterGroup.getWorldPosition(charPos);
            const headPos = charPos.clone();
            headPos.y += 3;
            const distanceToGhost = luvuGroup.position.distanceTo(charPos);
            const maxDistance = 50;
            const screenPos = headPos.clone().project(camera);
            const ghostScreenPos = luvuGroup.position.clone().project(camera);
            const ghostHeadPos = luvuGroup.position.clone();
            ghostHeadPos.y += 2;
            const ghostHeadScreenPos = ghostHeadPos.clone().project(camera);

            const isOnScreen = screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1;

            const charScreenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const charScreenY = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            const ghostHeadScreenX = (ghostHeadScreenPos.x * 0.5 + 0.5) * window.innerWidth;
            const ghostHeadScreenY = (-ghostHeadScreenPos.y * 0.5 + 0.5) * window.innerHeight;

            const chatX = charScreenX;
            const chatY = charScreenY - 60;
            const chatWidth = 250;
            const chatHeight = 50;
            const chatLeft = chatX - chatWidth / 2;
            const chatRight = chatX + chatWidth / 2;
            const chatTop = chatY - chatHeight / 2;
            const chatBottom = chatY + chatHeight / 2;

            const ghostSize = 80;
            const ghostLeft = ghostHeadScreenX - ghostSize;
            const ghostRight = ghostHeadScreenX + ghostSize;
            const ghostTop = ghostHeadScreenY - ghostSize;
            const ghostBottom = ghostHeadScreenY + ghostSize;

            const isOverlapping = !(chatRight < ghostLeft || chatLeft > ghostRight ||
                chatBottom < ghostTop || chatTop > ghostBottom);

            const cameraToChar = new THREE.Vector3().subVectors(headPos, camera.position);
            const cameraToGhost = new THREE.Vector3().subVectors(luvuGroup.position, camera.position);
            const charDistance = cameraToChar.length();
            const ghostDistance = cameraToGhost.length();
            const ghostIsBlocking = ghostDistance < charDistance && isOverlapping;

            if (isOnScreen && distanceToGhost <= maxDistance && !ghostIsBlocking) {
                if (time - lastMessageChangeTime >= 3) {
                    currentMessageIndex = (currentMessageIndex + 1) % newCharMessages.length;
                    chatEl.textContent = newCharMessages[currentMessageIndex];
                    lastMessageChangeTime = time;
                }
                chatEl.style.left = chatX + 'px';
                chatEl.style.top = chatY + 'px';
                chatEl.style.transform = 'translateX(-50%)';
                chatEl.style.display = 'block';
            } else {
                chatEl.style.display = 'none';
            }
        }
    }

    // Fat character chat
    if (characterModels[9] && characterModels[9].group) {
        const fatChar = characterModels[9];
        const chatEl = document.getElementById('fat-chat');
        const notifEl = document.getElementById('fat-notif');
        if (chatEl && notifEl) {
            const charPos = new THREE.Vector3();
            fatChar.group.getWorldPosition(charPos);
            const headPos = charPos.clone();
            headPos.y += 3;
            const distanceToGhost = luvuGroup.position.distanceTo(charPos);
            const maxDistance = 50;
            const screenPos = headPos.clone().project(camera);
            const ghostHeadPos = luvuGroup.position.clone();
            ghostHeadPos.y += 2;
            const ghostHeadScreenPos = ghostHeadPos.clone().project(camera);

            const isOnScreen = screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1;

            const charScreenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const charScreenY = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            const ghostHeadScreenX = (ghostHeadScreenPos.x * 0.5 + 0.5) * window.innerWidth;
            const ghostHeadScreenY = (-ghostHeadScreenPos.y * 0.5 + 0.5) * window.innerHeight;

            const chatX = charScreenX;
            const chatY = charScreenY - 160;
            const notifY = chatY - 40;

            const chatWidth = 250;
            const chatHeight = 50;
            const chatLeft = chatX - chatWidth / 2;
            const chatRight = chatX + chatWidth / 2;
            const chatTop = chatY - chatHeight / 2;
            const chatBottom = chatY + chatHeight / 2;

            const ghostSize = 80;
            const ghostLeft = ghostHeadScreenX - ghostSize;
            const ghostRight = ghostHeadScreenX + ghostSize;
            const ghostTop = ghostHeadScreenY - ghostSize;
            const ghostBottom = ghostHeadScreenY + ghostSize;

            const isOverlapping = !(chatRight < ghostLeft || chatLeft > ghostRight ||
                chatBottom < ghostTop || chatTop > ghostBottom);

            const cameraToChar = new THREE.Vector3().subVectors(headPos, camera.position);
            const cameraToGhost = new THREE.Vector3().subVectors(luvuGroup.position, camera.position);
            const charDistance = cameraToChar.length();
            const ghostDistance = cameraToGhost.length();
            const ghostIsBlocking = ghostDistance < charDistance && isOverlapping;

            if (isOnScreen && distanceToGhost <= maxDistance && !ghostIsBlocking) {
                if (time - fatLastMessageChangeTime >= 3) {
                    fatCurrentMessageIndex = (fatCurrentMessageIndex + 1) % fatMessages.length;
                    chatEl.textContent = fatMessages[fatCurrentMessageIndex];
                    fatLastMessageChangeTime = time;
                }
                chatEl.style.left = chatX + 'px';
                chatEl.style.top = chatY + 'px';
                chatEl.style.transform = 'translateX(-50%)';
                chatEl.style.display = 'block';
                notifEl.style.left = chatX + 'px';
                notifEl.style.top = notifY + 'px';
                notifEl.style.transform = 'translateX(-50%)';
                notifEl.style.display = 'block';
            } else {
                chatEl.style.display = 'none';
                notifEl.style.display = 'none';
            }
        }
    }

    // LM character chat
    if (characterModels[8] && characterModels[8].group) {
        const lmChar = characterModels[8];
        const chatEl = document.getElementById('lm-chat');
        const notifEl = document.getElementById('lm-notif');
        if (chatEl && notifEl) {
            const charPos = new THREE.Vector3();
            lmChar.group.getWorldPosition(charPos);
            const headPos = charPos.clone();
            headPos.y += 3;
            const distanceToGhost = luvuGroup.position.distanceTo(charPos);
            const maxDistance = 50;
            const screenPos = headPos.clone().project(camera);
            const ghostHeadPos = luvuGroup.position.clone();
            ghostHeadPos.y += 2;
            const ghostHeadScreenPos = ghostHeadPos.clone().project(camera);

            const isOnScreen = screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1;

            const charScreenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const charScreenY = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            const ghostHeadScreenX = (ghostHeadScreenPos.x * 0.5 + 0.5) * window.innerWidth;
            const ghostHeadScreenY = (-ghostHeadScreenPos.y * 0.5 + 0.5) * window.innerHeight;

            const chatX = charScreenX;
            const chatY = charScreenY - 160;
            const notifY = chatY - 40;

            const chatWidth = 250;
            const chatHeight = 50;
            const chatLeft = chatX - chatWidth / 2;
            const chatRight = chatX + chatWidth / 2;
            const chatTop = chatY - chatHeight / 2;
            const chatBottom = chatY + chatHeight / 2;

            const ghostSize = 80;
            const ghostLeft = ghostHeadScreenX - ghostSize;
            const ghostRight = ghostHeadScreenX + ghostSize;
            const ghostTop = ghostHeadScreenY - ghostSize;
            const ghostBottom = ghostHeadScreenY + ghostSize;

            const isOverlapping = !(chatRight < ghostLeft || chatLeft > ghostRight ||
                chatBottom < ghostTop || chatTop > ghostBottom);

            const cameraToChar = new THREE.Vector3().subVectors(headPos, camera.position);
            const cameraToGhost = new THREE.Vector3().subVectors(luvuGroup.position, camera.position);
            const charDistance = cameraToChar.length();
            const ghostDistance = cameraToGhost.length();
            const ghostIsBlocking = ghostDistance < charDistance && isOverlapping;

            if (isOnScreen && distanceToGhost <= maxDistance && !ghostIsBlocking) {
                if (time - lmLastMessageChangeTime >= 3) {
                    lmCurrentMessageIndex = (lmCurrentMessageIndex + 1) % lmMessages.length;
                    chatEl.textContent = lmMessages[lmCurrentMessageIndex];
                    lmLastMessageChangeTime = time;
                }
                chatEl.style.left = chatX + 'px';
                chatEl.style.top = chatY + 'px';
                chatEl.style.transform = 'translateX(-50%)';
                chatEl.style.display = 'block';
                notifEl.style.left = chatX + 'px';
                notifEl.style.top = notifY + 'px';
                notifEl.style.transform = 'translateX(-50%)';
                notifEl.style.display = 'block';
            } else {
                chatEl.style.display = 'none';
                notifEl.style.display = 'none';
            }
        }
    }
}

