// Utility functions for the mapmaker application

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
  let timeout;
  
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Show a modal by ID
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

// Hide a modal by ID
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Set up dropdown menus
function setupDropdowns() {
  // First, hide all dropdown menus
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.style.cssText = 'display: none !important';
  });
  
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (toggle && menu) {
      // Show menu on hover
      dropdown.addEventListener('mouseenter', () => {
        menu.style.cssText = 'display: block !important';
      });
      
      // Hide menu when mouse leaves
      dropdown.addEventListener('mouseleave', () => {
        menu.style.cssText = 'display: none !important';
      });
      
      // Toggle menu on click (for mobile)
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.getComputedStyle(menu).display === 'block') {
          menu.style.cssText = 'display: none !important';
        } else {
          // Hide all other menus first
          document.querySelectorAll('.dropdown-menu').forEach(m => {
            if (m !== menu) {
              m.style.cssText = 'display: none !important';
            }
          });
          menu.style.cssText = 'display: block !important';
        }
      });
    }
  });
  
  // Hide all menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.cssText = 'display: none !important';
      });
    }
  });
}

// Generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Convert RGB color to hex
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Create a tooltip
function createTooltip(element, text) {
  // Create the tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  
  // Position the tooltip
  const positionTooltip = (e) => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  };
  
  // Show the tooltip
  element.addEventListener('mouseenter', () => {
    document.body.appendChild(tooltip);
    element.addEventListener('mousemove', positionTooltip);
  });
  
  // Hide the tooltip
  element.addEventListener('mouseleave', () => {
    if (tooltip.parentNode) {
      document.body.removeChild(tooltip);
    }
    element.removeEventListener('mousemove', positionTooltip);
  });
}

// Check if a point is inside a rectangle
function isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
  return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
}

// Deep clone an object
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Get mouse position relative to element
function getRelativeMousePosition(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// Export functions
export {
  debounce,
  showModal,
  hideModal,
  setupDropdowns,
  generateUUID,
  distance,
  rgbToHex,
  hexToRgb,
  createTooltip,
  isPointInRect,
  deepClone,
  getRelativeMousePosition
};