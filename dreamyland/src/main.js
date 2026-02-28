import './style.css';
import { initGame } from './game/Game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // Handle navigation buttons
    const navButtons = document.querySelectorAll('.nav-button');
    const exploreButton = document.getElementById('nav-explore');
    
    // Set EXPLORE button as active by default
    if (exploreButton) {
        exploreButton.classList.add('active');
        exploreButton.style.background = '#A8DF65';
    }
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            button.style.background = '#A8DF65';
        });
    });
});
