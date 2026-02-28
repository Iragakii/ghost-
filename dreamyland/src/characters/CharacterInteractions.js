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

export function updateCharacterInteractions(camera, gameState, luvuGroup, characterModels, characterTimeouts, newCharacterGroup, cactusGroup, ippoacGroup, buckGroup, gockGroup, kubaGroup, babyGroup, time) {
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

    // Cactus Q notification (show when NOT following cactus, and current character is close)
    const cactusQNotifEl = getCachedElement('cactus-q-notif', 'cactusQNotif');
    if (cactusGroup && !gameState.isFollowingCactus && cactusQNotifEl) {
        const cactusPos = new THREE.Vector3();
        cactusGroup.getWorldPosition(cactusPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingIppoac && ippoacGroup) {
            ippoacGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            babyGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(cactusPos);
        const isClose = distanceFromCurrent < INTERACTION_DISTANCE;
        
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

    // Cactus F notification (show when current character is close to cactus, next to Q notification)
    if (cactusGroup && !gameState.isFollowingCactus) {
        const cactusPos = new THREE.Vector3();
        cactusGroup.getWorldPosition(cactusPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingIppoac && ippoacGroup) {
            ippoacGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            babyGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(cactusPos);
        const isClose = distanceFromCurrent < INTERACTION_DISTANCE;
        
        camera.updateMatrixWorld();
        const headPos = cactusPos.clone();
        headPos.y += 9; // Above head (same as Q notification)
        const screenPos = headPos.clone().project(camera);
        
        const cactusFNotifEl = document.getElementById('cactus-notif');
        const cactusChatEl = document.getElementById('cactus-chat');
        
        if (isClose) {
            if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                if (cactusFNotifEl && !gameState.cactusIsInteracting) {
                    batchStyleUpdate(cactusFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q (increased spacing)
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (cactusFNotifEl) batchStyleUpdate(cactusFNotifEl, { display: 'none' });
            }
        } else {
            if (cactusFNotifEl) batchStyleUpdate(cactusFNotifEl, { display: 'none' });
        }
        
        // Always update chat position when interacting (follows cactus head)
        if (gameState.cactusIsInteracting && cactusChatEl) {
            if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                batchStyleUpdate(cactusChatEl, {
                    display: 'block',
                    left: x + 'px',
                    top: (y - 60) + 'px',
                    transform: 'translateX(-50%)'
                });
            } else {
                batchStyleUpdate(cactusChatEl, { display: 'none' });
            }
        } else if (cactusChatEl && !gameState.cactusIsInteracting) {
            batchStyleUpdate(cactusChatEl, { display: 'none' });
        }
    } else {
        const cactusFNotifEl = document.getElementById('cactus-notif');
        const cactusChatEl = document.getElementById('cactus-chat');
        if (cactusFNotifEl) batchStyleUpdate(cactusFNotifEl, { display: 'none' });
        if (cactusChatEl && !gameState.cactusIsInteracting) {
            batchStyleUpdate(cactusChatEl, { display: 'none' });
        }
    }
    
    // Ippoac Q notification (show when NOT following ippoac, and current character is close)
    const qNotifEl = getCachedElement('ippoac-q-notif', 'ippoacQNotif');
    if (ippoacGroup && !gameState.isFollowingIppoac && qNotifEl) {
        const ippoacPos = new THREE.Vector3();
        ippoacGroup.getWorldPosition(ippoacPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingCactus && cactusGroup) {
            cactusGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            babyGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(ippoacPos);
        const isClose = distanceFromCurrent < INTERACTION_DISTANCE;
        
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
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingCactus && cactusGroup) {
            cactusGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(ippoacPos);
        const isClose = distanceFromCurrent < INTERACTION_DISTANCE;
        
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

    // Buck Q and F notifications (show when NOT following buck, and current character is close)
    const buckQNotifEl = document.getElementById('buck-q-notif');
    const buckFNotifEl = document.getElementById('buck-notif');
    const buckChatEl = document.getElementById('buck-chat');
    if (buckGroup && !gameState.isFollowingBuck) {
        const buckPos = new THREE.Vector3();
        buckGroup.getWorldPosition(buckPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingCactus && cactusGroup) {
            cactusGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingIppoac && ippoacGroup) {
            ippoacGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            babyGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(buckPos);
        
        // Show notifications if current character is close
        if (distanceFromCurrent < INTERACTION_DISTANCE) {
            camera.updateMatrixWorld();
            const headPos = buckPos.clone();
            headPos.y += 14; // Above head
            const screenPos = headPos.clone().project(camera);
            
            if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show Q notification
                if (buckQNotifEl) {
                    batchStyleUpdate(buckQNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show F notification next to Q (if not interacting)
                if (buckFNotifEl && !gameState.buckIsInteracting) {
                    batchStyleUpdate(buckFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (buckChatEl && gameState.buckIsInteracting) {
                    batchStyleUpdate(buckChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (buckQNotifEl) batchStyleUpdate(buckQNotifEl, { display: 'none' });
                if (buckFNotifEl) batchStyleUpdate(buckFNotifEl, { display: 'none' });
                if (buckChatEl && !gameState.buckIsInteracting) {
                    batchStyleUpdate(buckChatEl, { display: 'none' });
                }
            }
        } else {
            if (buckQNotifEl) batchStyleUpdate(buckQNotifEl, { display: 'none' });
            if (buckFNotifEl) batchStyleUpdate(buckFNotifEl, { display: 'none' });
            if (buckChatEl && !gameState.buckIsInteracting) {
                batchStyleUpdate(buckChatEl, { display: 'none' });
            }
        }
    } else if (buckQNotifEl && gameState.isFollowingBuck) {
        // Hide when following buck
        batchStyleUpdate(buckQNotifEl, { display: 'none' });
        if (buckFNotifEl) batchStyleUpdate(buckFNotifEl, { display: 'none' });
    }
    
    // Always update Buck chat position when interacting (follows buck head)
    if (gameState.buckIsInteracting && buckGroup && buckChatEl) {
        camera.updateMatrixWorld();
        const buckPos = new THREE.Vector3();
        buckGroup.getWorldPosition(buckPos);
        const headPos = buckPos.clone();
        headPos.y += 14; // Above head
        const screenPos = headPos.clone().project(camera);
        
        if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            
            batchStyleUpdate(buckChatEl, {
                display: 'block',
                left: x + 'px',
                top: (y - 60) + 'px',
                transform: 'translateX(-50%)'
            });
        } else {
            batchStyleUpdate(buckChatEl, { display: 'none' });
        }
    }

    // Gock Q and F notifications (show when NOT following gock, and current character is close)
    const gockQNotifEl = document.getElementById('gock-q-notif');
    const gockFNotifEl = document.getElementById('gock-notif');
    const gockChatEl = document.getElementById('gock-chat');
    if (gockGroup && !gameState.isFollowingGock) {
        const gockPos = new THREE.Vector3();
        gockGroup.getWorldPosition(gockPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingCactus && cactusGroup) {
            cactusGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingIppoac && ippoacGroup) {
            ippoacGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            babyGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(gockPos);
        
        // Show notifications if current character is close
        if (distanceFromCurrent < INTERACTION_DISTANCE) {
            camera.updateMatrixWorld();
            const headPos = gockPos.clone();
            headPos.y += 14; // Above head
            const screenPos = headPos.clone().project(camera);
            
            if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show Q notification
                if (gockQNotifEl) {
                    batchStyleUpdate(gockQNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show F notification next to Q (if not interacting)
                if (gockFNotifEl && !gameState.gockIsInteracting) {
                    batchStyleUpdate(gockFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (gockChatEl && gameState.gockIsInteracting) {
                    batchStyleUpdate(gockChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (gockQNotifEl) batchStyleUpdate(gockQNotifEl, { display: 'none' });
                if (gockFNotifEl) batchStyleUpdate(gockFNotifEl, { display: 'none' });
                if (gockChatEl && !gameState.gockIsInteracting) {
                    batchStyleUpdate(gockChatEl, { display: 'none' });
                }
            }
        } else {
            if (gockQNotifEl) batchStyleUpdate(gockQNotifEl, { display: 'none' });
            if (gockFNotifEl) batchStyleUpdate(gockFNotifEl, { display: 'none' });
            if (gockChatEl && !gameState.gockIsInteracting) {
                batchStyleUpdate(gockChatEl, { display: 'none' });
            }
        }
    } else if (gockQNotifEl && gameState.isFollowingGock) {
        // Hide when following gock
        batchStyleUpdate(gockQNotifEl, { display: 'none' });
        if (gockFNotifEl) batchStyleUpdate(gockFNotifEl, { display: 'none' });
    }
    
    // Always update Gock chat position when interacting (follows gock head)
    if (gameState.gockIsInteracting && gockGroup && gockChatEl) {
        camera.updateMatrixWorld();
        const gockPos = new THREE.Vector3();
        gockGroup.getWorldPosition(gockPos);
        const headPos = gockPos.clone();
        headPos.y += 14; // Above head
        const screenPos = headPos.clone().project(camera);
        
        if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            
            batchStyleUpdate(gockChatEl, {
                display: 'block',
                left: x + 'px',
                top: (y - 60) + 'px',
                transform: 'translateX(-50%)'
            });
        } else {
            batchStyleUpdate(gockChatEl, { display: 'none' });
        }
    }

    // Kuba Q and F notifications (show when NOT following kuba, and current character is close)
    const kubaQNotifEl = document.getElementById('kuba-q-notif');
    const kubaFNotifEl = document.getElementById('kuba-notif');
    const kubaChatEl = document.getElementById('kuba-chat');
    if (kubaGroup && !gameState.isFollowingKuba) {
        const kubaPos = new THREE.Vector3();
        kubaGroup.getWorldPosition(kubaPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingCactus && cactusGroup) {
            cactusGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingIppoac && ippoacGroup) {
            ippoacGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            babyGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(kubaPos);
        
        // Show notifications if current character is close
        if (distanceFromCurrent < INTERACTION_DISTANCE) {
            camera.updateMatrixWorld();
            const headPos = kubaPos.clone();
            headPos.y += 13; // Above head
            const screenPos = headPos.clone().project(camera);
            
            if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show Q notification
                if (kubaQNotifEl) {
                    batchStyleUpdate(kubaQNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show F notification next to Q (if not interacting)
                if (kubaFNotifEl && !gameState.kubaIsInteracting) {
                    batchStyleUpdate(kubaFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (kubaChatEl && gameState.kubaIsInteracting) {
                    batchStyleUpdate(kubaChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (kubaQNotifEl) batchStyleUpdate(kubaQNotifEl, { display: 'none' });
                if (kubaFNotifEl) batchStyleUpdate(kubaFNotifEl, { display: 'none' });
                if (kubaChatEl && !gameState.kubaIsInteracting) {
                    batchStyleUpdate(kubaChatEl, { display: 'none' });
                }
            }
        } else {
            if (kubaQNotifEl) batchStyleUpdate(kubaQNotifEl, { display: 'none' });
            if (kubaFNotifEl) batchStyleUpdate(kubaFNotifEl, { display: 'none' });
            if (kubaChatEl && !gameState.kubaIsInteracting) {
                batchStyleUpdate(kubaChatEl, { display: 'none' });
            }
        }
    } else if (kubaQNotifEl && gameState.isFollowingKuba) {
        // Hide when following kuba
        batchStyleUpdate(kubaQNotifEl, { display: 'none' });
        if (kubaFNotifEl) batchStyleUpdate(kubaFNotifEl, { display: 'none' });
    }
    
    // Always update Kuba chat position when interacting (follows kuba head)
    if (gameState.kubaIsInteracting && kubaGroup && kubaChatEl) {
        camera.updateMatrixWorld();
        const kubaPos = new THREE.Vector3();
        if (kubaGroup.getWorldPosition) {
            kubaGroup.getWorldPosition(kubaPos);
        } else {
            kubaPos.copy(kubaGroup.position);
        }
        const headPos = kubaPos.clone();
        headPos.y += 9; // Above head
        const screenPos = headPos.clone().project(camera);
        
        if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            
            batchStyleUpdate(kubaChatEl, {
                display: 'block',
                left: x + 'px',
                top: (y - 60) + 'px',
                transform: 'translateX(-50%)'
            });
        } else {
            batchStyleUpdate(kubaChatEl, { display: 'none' });
        }
    }

    // Baby Q and F notifications (show when NOT following baby, and current character is close)
    const babyQNotifEl = document.getElementById('baby-q-notif');
    const babyFNotifEl = document.getElementById('baby-notif');
    const babyChatEl = document.getElementById('baby-chat');
    if (babyGroup && !gameState.isFollowingBaby) {
        const babyPos = new THREE.Vector3();
        babyGroup.getWorldPosition(babyPos);
        
        // Check distance from current character (Luvu or whoever we're following)
        let currentCharPos = luvuGroup.position.clone();
        if (gameState.isFollowingCactus && cactusGroup) {
            cactusGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingIppoac && ippoacGroup) {
            ippoacGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            buckGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            gockGroup.getWorldPosition(currentCharPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            kubaGroup.getWorldPosition(currentCharPos);
        }
        
        const distanceFromCurrent = currentCharPos.distanceTo(babyPos);
        
        // Show notifications if current character is close
        if (distanceFromCurrent < INTERACTION_DISTANCE) {
            camera.updateMatrixWorld();
            const headPos = babyPos.clone();
            headPos.y += 9; // Above head
            const screenPos = headPos.clone().project(camera);
            
            if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show Q notification
                if (babyQNotifEl) {
                    batchStyleUpdate(babyQNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show F notification next to Q (if not interacting)
                if (babyFNotifEl && !gameState.babyIsInteracting) {
                    batchStyleUpdate(babyFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (babyChatEl && gameState.babyIsInteracting) {
                    batchStyleUpdate(babyChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (babyQNotifEl) batchStyleUpdate(babyQNotifEl, { display: 'none' });
                if (babyFNotifEl) batchStyleUpdate(babyFNotifEl, { display: 'none' });
                if (babyChatEl && !gameState.babyIsInteracting) {
                    batchStyleUpdate(babyChatEl, { display: 'none' });
                }
            }
        } else {
            if (babyQNotifEl) batchStyleUpdate(babyQNotifEl, { display: 'none' });
            if (babyFNotifEl) batchStyleUpdate(babyFNotifEl, { display: 'none' });
            if (babyChatEl && !gameState.babyIsInteracting) {
                batchStyleUpdate(babyChatEl, { display: 'none' });
            }
        }
    } else if (babyQNotifEl && gameState.isFollowingBaby) {
        // Hide when following baby
        batchStyleUpdate(babyQNotifEl, { display: 'none' });
        if (babyFNotifEl) batchStyleUpdate(babyFNotifEl, { display: 'none' });
    }
    
    // Always update Baby chat position when interacting (follows baby head)
    if (gameState.babyIsInteracting && babyGroup && babyChatEl) {
        camera.updateMatrixWorld();
        const babyPos = new THREE.Vector3();
        if (babyGroup.getWorldPosition) {
            babyGroup.getWorldPosition(babyPos);
        } else {
            babyPos.copy(babyGroup.position);
        }
        const headPos = babyPos.clone();
        headPos.y += 9; // Above head
        const screenPos = headPos.clone().project(camera);
        
        if (screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1 && screenPos.z < 1 && screenPos.z > -1) {
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            
            batchStyleUpdate(babyChatEl, {
                display: 'block',
                left: x + 'px',
                top: (y - 60) + 'px',
                transform: 'translateX(-50%)'
            });
        } else {
            batchStyleUpdate(babyChatEl, { display: 'none' });
        }
    }

    // Luvu Q notification (show when following cactus, ippoac, buck, gock, kuba, or baby, to switch back)
    if (gameState.isFollowingCactus || gameState.isFollowingIppoac || gameState.isFollowingBuck || gameState.isFollowingGock || gameState.isFollowingKuba || gameState.isFollowingBaby) {
        const luvuPos = luvuGroup.position.clone();
        let distanceToLuvu = Infinity;
        
        if (gameState.isFollowingCactus && cactusGroup) {
            distanceToLuvu = cactusGroup.position.distanceTo(luvuPos);
        } else if (gameState.isFollowingIppoac && ippoacGroup) {
            const ippoacPos = new THREE.Vector3();
            ippoacGroup.getWorldPosition(ippoacPos);
            distanceToLuvu = ippoacPos.distanceTo(luvuPos);
        } else if (gameState.isFollowingBuck && buckGroup) {
            const buckPos = new THREE.Vector3();
            buckGroup.getWorldPosition(buckPos);
            distanceToLuvu = buckPos.distanceTo(luvuPos);
        } else if (gameState.isFollowingGock && gockGroup) {
            const gockPos = new THREE.Vector3();
            gockGroup.getWorldPosition(gockPos);
            distanceToLuvu = gockPos.distanceTo(luvuPos);
        } else if (gameState.isFollowingKuba && kubaGroup) {
            const kubaPos = new THREE.Vector3();
            if (kubaGroup.getWorldPosition) {
                kubaGroup.getWorldPosition(kubaPos);
            } else {
                kubaPos.copy(kubaGroup.position);
            }
            distanceToLuvu = kubaPos.distanceTo(luvuPos);
        } else if (gameState.isFollowingBaby && babyGroup) {
            const babyPos = new THREE.Vector3();
            if (babyGroup.getWorldPosition) {
                babyGroup.getWorldPosition(babyPos);
            } else {
                babyPos.copy(babyGroup.position);
            }
            distanceToLuvu = babyPos.distanceTo(luvuPos);
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

    // Minescar Q and F notifications
    let minescarModel = null;
    for (let i = 0; i < characterModels.length; i++) {
        if (characterModels[i] && characterModels[i].isMinescar && characterModels[i].group) {
            minescarModel = characterModels[i];
            break;
        }
    }

    if (minescarModel && minescarModel.group) {
        const minescarPos = new THREE.Vector3();
        minescarModel.group.getWorldPosition(minescarPos);
        const distanceToMinescar = luvuGroup.position.distanceTo(minescarPos);
        
        if (distanceToMinescar < INTERACTION_DISTANCE) {
            camera.updateMatrixWorld();
            const headPos = minescarPos.clone();
            headPos.y += 5;
            // Above head
            const screenPos = headPos.clone().project(camera);
            
            const minescarQNotifEl = document.getElementById('minescar-q-notif');
            const minescarFNotifEl = document.getElementById('minescar-notif');
            const minescarChatEl = document.getElementById('minescar-chat');
            
            if (screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show Q notification
                if (minescarQNotifEl) {
                    batchStyleUpdate(minescarQNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show F notification next to Q
                if (minescarFNotifEl && !minescarModel.isInteracting) {
                    batchStyleUpdate(minescarFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (minescarChatEl && minescarModel.isInteracting) {
                    batchStyleUpdate(minescarChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (minescarQNotifEl) batchStyleUpdate(minescarQNotifEl, { display: 'none' });
                if (minescarFNotifEl) batchStyleUpdate(minescarFNotifEl, { display: 'none' });
                if (minescarChatEl && !minescarModel.isInteracting) {
                    batchStyleUpdate(minescarChatEl, { display: 'none' });
                }
            }
        } else {
            const minescarQNotifEl = document.getElementById('minescar-q-notif');
            const minescarFNotifEl = document.getElementById('minescar-notif');
            const minescarChatEl = document.getElementById('minescar-chat');
            if (minescarQNotifEl) batchStyleUpdate(minescarQNotifEl, { display: 'none' });
            if (minescarFNotifEl) batchStyleUpdate(minescarFNotifEl, { display: 'none' });
            if (minescarChatEl && !minescarModel.isInteracting) {
                batchStyleUpdate(minescarChatEl, { display: 'none' });
            }
        }
    }

    // Handeye Q and F notifications
    let handeyeModel = null;
    for (let i = 0; i < characterModels.length; i++) {
        if (characterModels[i] && characterModels[i].isHandeye && characterModels[i].group) {
            handeyeModel = characterModels[i];
            break;
        }
    }

    if (handeyeModel && handeyeModel.group) {
        const handeyePos = new THREE.Vector3();
        handeyeModel.group.getWorldPosition(handeyePos);
        const distanceToHandeye = luvuGroup.position.distanceTo(handeyePos);
        
        if (distanceToHandeye < INTERACTION_DISTANCE) {
            camera.updateMatrixWorld();
            const headPos = handeyePos.clone();
            headPos.y += 8; // Above head
            const screenPos = headPos.clone().project(camera);
            
            const handeyeQNotifEl = document.getElementById('handeye-q-notif');
            const handeyeFNotifEl = document.getElementById('handeye-notif');
            const handeyeChatEl = document.getElementById('handeye-chat');
            
            if (screenPos.x >= -1 && screenPos.x <= 1 &&
                screenPos.y >= -1 && screenPos.y <= 1 &&
                screenPos.z < 1 && screenPos.z > -1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
                
                // Show Q notification
                if (handeyeQNotifEl) {
                    batchStyleUpdate(handeyeQNotifEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show F notification next to Q
                if (handeyeFNotifEl && !handeyeModel.isInteracting) {
                    batchStyleUpdate(handeyeFNotifEl, {
                        display: 'block',
                        left: (x + 48) + 'px', // Position to the right of Q
                        top: (y - 40) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
                
                // Show chat bubble if interacting
                if (handeyeChatEl && handeyeModel.isInteracting) {
                    batchStyleUpdate(handeyeChatEl, {
                        display: 'block',
                        left: x + 'px',
                        top: (y - 60) + 'px',
                        transform: 'translateX(-50%)'
                    });
                }
            } else {
                if (handeyeQNotifEl) batchStyleUpdate(handeyeQNotifEl, { display: 'none' });
                if (handeyeFNotifEl) batchStyleUpdate(handeyeFNotifEl, { display: 'none' });
                if (handeyeChatEl && !handeyeModel.isInteracting) {
                    batchStyleUpdate(handeyeChatEl, { display: 'none' });
                }
            }
        } else {
            const handeyeQNotifEl = document.getElementById('handeye-q-notif');
            const handeyeFNotifEl = document.getElementById('handeye-notif');
            const handeyeChatEl = document.getElementById('handeye-chat');
            if (handeyeQNotifEl) batchStyleUpdate(handeyeQNotifEl, { display: 'none' });
            if (handeyeFNotifEl) batchStyleUpdate(handeyeFNotifEl, { display: 'none' });
            if (handeyeChatEl && !handeyeModel.isInteracting) {
                batchStyleUpdate(handeyeChatEl, { display: 'none' });
            }
        }
    }
}

