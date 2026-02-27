import * as THREE from 'three';

const INTERACTION_DISTANCE = 8;

// Cache DOM element references to reduce getElementById calls (INP optimization)
const domCache = {
    cactusQNotif: null,
    luvuQNotif: null,
    ippoacQNotif: null,
    initialized: false
};

function getCachedElement(id, cacheKey) {
    if (!domCache.initialized) {
        domCache.cactusQNotif = document.getElementById('cactus-q-notif');
        domCache.luvuQNotif = document.getElementById('luvu-q-notif');
        domCache.ippoacQNotif = document.getElementById('ippoac-q-notif');
        domCache.initialized = true;
    }
    return domCache[cacheKey];
}

// Batch DOM updates to reduce layout thrashing (INP optimization)
let pendingStyleUpdates = new Map();
let styleUpdateRafId = null;

function batchStyleUpdate(element, styles) {
    if (!element) return;
    
    const key = element;
    if (!pendingStyleUpdates.has(key)) {
        pendingStyleUpdates.set(key, {});
    }
    Object.assign(pendingStyleUpdates.get(key), styles);
    
    if (styleUpdateRafId === null) {
        styleUpdateRafId = requestAnimationFrame(() => {
            pendingStyleUpdates.forEach((styles, element) => {
                Object.assign(element.style, styles);
            });
            pendingStyleUpdates.clear();
            styleUpdateRafId = null;
        });
    }
}

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

export function updateCharacterInteractions(camera, gameState, luvuGroup, characterModels, characterTimeouts, newCharacterGroup, cactusGroup, ippoacGroup, time) {
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

            // Q notification for f.glb (index 3)
            if (i === 3 && !char.isInteracting) {
                const qNotifEl = document.getElementById('f-q-notif');
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
            } else if (i === 3) {
                const qNotifEl = document.getElementById('f-q-notif');
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
            if (i === 3) {
                const qNotifEl = document.getElementById('f-q-notif');
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

    // Cactus Q notification (show when NOT following cactus, and either Luvu or ippoac is close)
    const cactusQNotifEl = getCachedElement('cactus-q-notif', 'cactusQNotif');
    if (cactusGroup && !gameState.isFollowingCactus && cactusQNotifEl) {
        const cactusPos = new THREE.Vector3();
        cactusGroup.getWorldPosition(cactusPos);
        const distanceFromLuvu = luvuGroup.position.distanceTo(cactusPos);
        let distanceFromIppoac = Infinity;
        if (ippoacGroup) {
            const ippoacPos = new THREE.Vector3();
            ippoacGroup.getWorldPosition(ippoacPos);
            distanceFromIppoac = ippoacPos.distanceTo(cactusPos);
        }
        
        // Show notification if:
        // - Luvu is close (and not following ippoac), OR
        // - Ippoac is close (regardless of follow state, since we want to show it when ippoac approaches)
        const isClose = (!gameState.isFollowingIppoac && distanceFromLuvu < INTERACTION_DISTANCE) || 
                        (distanceFromIppoac < INTERACTION_DISTANCE);
        
        if (isClose) {
            // Update camera matrix before projecting
            camera.updateMatrixWorld();
            
            // Position notification above cactus head
            const headPos = cactusPos.clone();
            headPos.y += 9; // Above head
            const screenPos = headPos.clone().project(camera);
            
            if (screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Batch style updates for better INP
                batchStyleUpdate(cactusQNotifEl, {
                    display: 'block',
                    left: x + 'px',
                    top: (y - 40) + 'px',
                    transform: 'translateX(-50%)'
                });
            } else {
                batchStyleUpdate(cactusQNotifEl, { display: 'none' });
            }
        } else {
            batchStyleUpdate(cactusQNotifEl, { display: 'none' });
        }
    } else if (cactusQNotifEl && gameState.isFollowingCactus) {
        // Hide when following cactus
        batchStyleUpdate(cactusQNotifEl, { display: 'none' });
    }
    
    // Ippoac Q notification (show when NOT following ippoac, and either Luvu or cactus is close)
    const qNotifEl = getCachedElement('ippoac-q-notif', 'ippoacQNotif');
    if (ippoacGroup && !gameState.isFollowingIppoac && qNotifEl) {
        const ippoacPos = new THREE.Vector3();
        ippoacGroup.getWorldPosition(ippoacPos);
        
        // Check distance from both Luvu and cactus
        const distanceFromLuvu = luvuGroup.position.distanceTo(ippoacPos);
        let distanceFromCactus = Infinity;
        if (cactusGroup) {
            const cactusPos = new THREE.Vector3();
            cactusGroup.getWorldPosition(cactusPos);
            distanceFromCactus = cactusPos.distanceTo(ippoacPos);
        }
        
        // Show notification if either Luvu or cactus is close
        const isClose = distanceFromLuvu < INTERACTION_DISTANCE || distanceFromCactus < INTERACTION_DISTANCE;
        
        if (isClose) {
            // Update camera matrix before projecting
            camera.updateMatrixWorld();
            
            // Position notification above ippoac head
            const headPos = ippoacPos.clone();
            headPos.y += 13;
            headPos.x += 0.5; // Above head
            const screenPos = headPos.clone().project(camera);
            
            if (screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Batch style updates for better INP
                batchStyleUpdate(qNotifEl, {
                    display: 'block',
                    left: x + 'px',
                    top: (y - 40) + 'px',
                    transform: 'translateX(-50%)'
                });
            } else {
                batchStyleUpdate(qNotifEl, { display: 'none' });
            }
        } else {
            batchStyleUpdate(qNotifEl, { display: 'none' });
        }
    } else if (qNotifEl) {
        // Hide ippoac Q notification when following ippoac or if group doesn't exist
        batchStyleUpdate(qNotifEl, { display: 'none' });
    }
    
    // Ippoac F notification (show when Luvu or Cactus is close to ippoac, next to Q notification)
    if (ippoacGroup && !gameState.isFollowingIppoac) {
        const ippoacPos = new THREE.Vector3();
        ippoacGroup.getWorldPosition(ippoacPos);
        
        // Check distance from both Luvu and Cactus
        const distanceFromLuvu = luvuGroup.position.distanceTo(ippoacPos);
        let distanceFromCactus = Infinity;
        if (cactusGroup) {
            const cactusPos = new THREE.Vector3();
            cactusGroup.getWorldPosition(cactusPos);
            distanceFromCactus = cactusPos.distanceTo(ippoacPos);
        }
        
        // Show F notification if either Luvu or Cactus is close
        const isClose = distanceFromLuvu < INTERACTION_DISTANCE || distanceFromCactus < INTERACTION_DISTANCE;
        
        if (isClose) {
            camera.updateMatrixWorld();
            
            const headPos = ippoacPos.clone();
            headPos.y += 13; // Above head
            const screenPos = headPos.clone().project(camera);
            
            const ippoacNotifEl = document.getElementById('ippoac-notif');
            const ippoacChatEl = document.getElementById('ippoac-chat');
            
            if (screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show F notification next to Q notification (position F to the right of Q)
                if (ippoacNotifEl && !gameState.ippoacIsInteracting) {
                    batchStyleUpdate(ippoacNotifEl, {
                        display: 'block',
                        left: (x + 40) + 'px', // Position to the right of Q (Q is at x, F is at x + 40)
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (ippoacChatEl && gameState.ippoacIsInteracting) {
                    batchStyleUpdate(ippoacChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (ippoacNotifEl) batchStyleUpdate(ippoacNotifEl, { display: 'none' });
                if (ippoacChatEl && !gameState.ippoacIsInteracting) {
                    batchStyleUpdate(ippoacChatEl, { display: 'none' });
                }
            }
        } else {
            const ippoacNotifEl = document.getElementById('ippoac-notif');
            const ippoacChatEl = document.getElementById('ippoac-chat');
            if (ippoacNotifEl) batchStyleUpdate(ippoacNotifEl, { display: 'none' });
            if (ippoacChatEl && !gameState.ippoacIsInteracting) {
                batchStyleUpdate(ippoacChatEl, { display: 'none' });
            }
            // Reset interaction state when far away
            if (gameState.ippoacIsInteracting) {
                gameState.ippoacIsInteracting = false;
                if (gameState.ippoacChatTimeout) {
                    clearTimeout(gameState.ippoacChatTimeout);
                    gameState.ippoacChatTimeout = null;
                }
            }
        }
    } else {
        // Hide when following ippoac
        const ippoacNotifEl = document.getElementById('ippoac-notif');
        if (ippoacNotifEl) batchStyleUpdate(ippoacNotifEl, { display: 'none' });
    }
    
    // Hide cactus Q notification only when following cactus (not ippoac, so we can switch from ippoac to cactus)
    if (gameState.isFollowingCactus) {
        const cactusQNotifEl = getCachedElement('cactus-q-notif', 'cactusQNotif');
        if (cactusQNotifEl) {
            batchStyleUpdate(cactusQNotifEl, { display: 'none' });
        }
    }

    // Luvu Q notification (show when following cactus or ippoac, to switch back)
    if (gameState.isFollowingCactus || gameState.isFollowingIppoac) {
        const luvuPos = luvuGroup.position.clone();
        let distanceToLuvu = Infinity;
        
        if (gameState.isFollowingCactus && cactusGroup) {
            distanceToLuvu = cactusGroup.position.distanceTo(luvuPos);
        } else if (gameState.isFollowingIppoac && ippoacGroup) {
            const ippoacPos = new THREE.Vector3();
            ippoacGroup.getWorldPosition(ippoacPos);
            distanceToLuvu = ippoacPos.distanceTo(luvuPos);
        }
        
        const qNotifEl = getCachedElement('luvu-q-notif', 'luvuQNotif');
        if (qNotifEl) {
            // Show notification when close to Luvu (within interaction distance)
            if (distanceToLuvu < INTERACTION_DISTANCE * 2) {
                // Position notification above Luvu head
                const headPos = luvuPos.clone();
                headPos.y += 3; // Above head
                const screenPos = headPos.clone().project(camera);
                
                if (screenPos.x >= -1 && screenPos.x <= 1 &&
                    screenPos.y >= -1 && screenPos.y <= 1 &&
                    screenPos.z < 1 && screenPos.z > -1) {
                    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                    
                    // Batch style updates for better INP
                    batchStyleUpdate(qNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                } else {
                    batchStyleUpdate(qNotifEl, { display: 'none' });
                }
            } else {
                batchStyleUpdate(qNotifEl, { display: 'none' });
            }
        }
    } else {
        // Show Luvu Q notification when ippoac is near (and not following anyone)
        if (ippoacGroup && !gameState.isFollowingIppoac && !gameState.isFollowingCactus) {
            const luvuPos = luvuGroup.position.clone();
            const ippoacPos = new THREE.Vector3();
            ippoacGroup.getWorldPosition(ippoacPos);
            const distanceFromIppoac = ippoacPos.distanceTo(luvuPos);
            
            const qNotifEl = getCachedElement('luvu-q-notif', 'luvuQNotif');
            if (qNotifEl) {
                if (distanceFromIppoac < INTERACTION_DISTANCE) {
                    // Position notification above Luvu head
                    const headPos = luvuPos.clone();
                    headPos.y += 3; // Above head
                    const screenPos = headPos.clone().project(camera);
                    
                    if (screenPos.x >= -1 && screenPos.x <= 1 &&
                        screenPos.y >= -1 && screenPos.y <= 1 &&
                        screenPos.z < 1 && screenPos.z > -1) {
                        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                        
                        // Batch style updates for better INP
                        batchStyleUpdate(qNotifEl, {
                            display: 'block',
                            left: x + 'px',
                            top: (y - 40) + 'px',
                            transform: 'translateX(-50%)'
                        });
                    } else {
                        batchStyleUpdate(qNotifEl, { display: 'none' });
                    }
                } else {
                    batchStyleUpdate(qNotifEl, { display: 'none' });
                }
            }
        } else {
            // Hide Luvu Q notification when not following cactus/ippoac and ippoac not near
            const qNotifEl = getCachedElement('luvu-q-notif', 'luvuQNotif');
            if (qNotifEl) {
                batchStyleUpdate(qNotifEl, { display: 'none' });
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

