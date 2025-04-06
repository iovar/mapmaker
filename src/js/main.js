// Import modules
import { initCanvas, setupCanvas, drawGrid, drawTile, drawEdge, clearTile } from './canvas.js';
import { loadAssets, getAssetsByTheme } from './assetManager.js';
import { saveMap, loadMap, exportPNG } from './mapSaver.js';
import { showModal, hideModal, debounce, setupDropdowns } from './utils.js';

// Application state
const state = {
  map: null,
  tileSize: 32,
  theme: 'Classic Dungeon',
  themeColor: '#000000',
  selectedTool: 'select',
  selectedEdgeType: 'wall',
  selectedAsset: null,
  assetRotation: 0, // 0, 90, 180, or 270 degrees
  clipboard: null,
  selection: {
    active: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  },
  history: [],
  historyIndex: -1,
  showGrid: true,
  zoomLevel: 1,
  isPanning: false,
  lastPanPoint: { x: 0, y: 0 },
  assets: {}
};

// DOM elements
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const mapWidthInput = document.getElementById('map-width');
const mapHeightInput = document.getElementById('map-height');
const tileSizeSelect = document.getElementById('tile-size');
const themeSelect = document.getElementById('theme-select');
const createMapBtn = document.getElementById('create-map');
const assetList = document.getElementById('asset-list');
const assetSearch = document.getElementById('asset-search');

// Tool buttons
const toolButtons = {
  select: document.getElementById('tool-select'),
  fill: document.getElementById('tool-fill'),
  empty: document.getElementById('tool-empty'),
  edge: document.getElementById('tool-edge')
};

// Edge type buttons
const edgeButtons = {
  wall: document.getElementById('edge-wall'),
  cracked: document.getElementById('edge-cracked'),
  door: document.getElementById('edge-door'),
  window: document.getElementById('edge-window'),
  secret: document.getElementById('edge-secret'),
  trap: document.getElementById('edge-trap'),
  lever: document.getElementById('edge-lever')
};

// Menu items
document.getElementById('new-map').addEventListener('click', () => showModal('new-map-modal'));
document.getElementById('new-map-cancel').addEventListener('click', () => hideModal('new-map-modal'));
document.getElementById('new-map-create').addEventListener('click', createNewMapFromModal);
document.getElementById('save-map').addEventListener('click', () => saveMap(state.map, state.theme, state.tileSize));
document.getElementById('open-map').addEventListener('click', loadSavedMap);
document.getElementById('export-png').addEventListener('click', () => exportPNG(canvas, state.showGrid));
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('toggle-grid').addEventListener('click', toggleGrid);
document.getElementById('zoom-in').addEventListener('click', () => zoomCanvas(0.1));
document.getElementById('zoom-out').addEventListener('click', () => zoomCanvas(-0.1));
document.getElementById('zoom-reset').addEventListener('click', () => {
  state.zoomLevel = 1;
  redrawCanvas();
});

// Rotate the selected asset
function rotateAsset() {
  if (!state.selectedAsset) return;
  
  // Cycle through 0, 90, 180, 270 degrees
  state.assetRotation = (state.assetRotation + 90) % 360;
  
  // Update UI to show rotation status
  updateRotationStatus();
}

// Update rotation status indicator
function updateRotationStatus() {
  const rotateBtn = document.getElementById('rotate-asset');
  if (rotateBtn) {
    rotateBtn.innerHTML = `<span class="icon">&#8635;</span> ${state.assetRotation}°`;
  }
}

// Initialize the application
async function initializeApp() {
  // Load assets from themes
  state.assets = await loadAssets();
  
  // Set up initial canvas and interface
  createMapBtn.addEventListener('click', createNewMap);
  
  // Set up rotation button
  const rotateBtn = document.getElementById('rotate-asset');
  if (rotateBtn) {
    rotateBtn.addEventListener('click', rotateAsset);
    updateRotationStatus(); // Initialize rotation display
  }
  
  // Set up tool buttons event listeners
  for (const toolId in toolButtons) {
    toolButtons[toolId].addEventListener('click', () => {
      setActiveTool(toolId);
    });
  }
  
  // Set up edge buttons event listeners
  for (const edgeId in edgeButtons) {
    edgeButtons[edgeId].addEventListener('click', () => {
      setActiveEdgeType(edgeId);
    });
  }
  
  // Set up theme select event listener
  themeSelect.addEventListener('change', () => {
    state.theme = themeSelect.value;
    updateThemeColor();
    populateAssetList();
  });
  
  // Set up asset search event listener
  assetSearch.addEventListener('input', debounce(filterAssets, 300));
  
  // Set up canvas event listeners
  setupCanvasEventListeners();
  
  // Set up dropdown menus
  setupDropdowns();
  
  // Populate asset list initially
  populateAssetList();
  
  // Set default active tool
  setActiveTool('select');
  
  // Set default active edge type
  setActiveEdgeType('wall');
}

// Create a new map based on input values
function createNewMap() {
  const width = parseInt(mapWidthInput.value, 10);
  const height = parseInt(mapHeightInput.value, 10);
  const tileSize = parseInt(tileSizeSelect.value, 10);
  const theme = themeSelect.value;
  
  createMap(width, height, tileSize, theme);
}

// Create a new map from modal values
function createNewMapFromModal() {
  const width = parseInt(document.getElementById('new-map-width').value, 10);
  const height = parseInt(document.getElementById('new-map-height').value, 10);
  const tileSize = parseInt(document.getElementById('new-map-tile-size').value, 10);
  const theme = document.getElementById('new-map-theme').value;
  
  createMap(width, height, tileSize, theme);
  hideModal('new-map-modal');
}

// Create and initialize a map
function createMap(width, height, tileSize, theme) {
  // Validate inputs
  if (isNaN(width) || width < 1 || isNaN(height) || height < 1 || isNaN(tileSize)) {
    alert('Please enter valid map dimensions');
    return;
  }
  
  // Initialize the map data structure
  state.map = Array(height).fill().map(() => Array(width).fill().map(() => ({
    type: 'empty',
    asset: null,
    rotation: 0, // Store rotation for each tile
    edges: {
      top: null,
      right: null,
      bottom: null,
      left: null
    }
  })));
  
  state.tileSize = tileSize;
  state.theme = theme;
  updateThemeColor();
  
  // Clear history
  state.history = [JSON.parse(JSON.stringify(state.map))];
  state.historyIndex = 0;
  
  // Set up canvas
  setupCanvas(canvas, width, height, tileSize);
  
  // Draw initial map
  redrawCanvas();
}

// Load a saved map
function loadSavedMap() {
  loadMap().then(data => {
    if (data) {
      state.map = data.map;
      state.tileSize = data.tileSize;
      state.theme = data.theme;
      updateThemeColor();
      
      // Update UI elements
      tileSizeSelect.value = state.tileSize;
      themeSelect.value = state.theme;
      mapWidthInput.value = state.map[0].length;
      mapHeightInput.value = state.map.length;
      
      // Clear history and add current state
      state.history = [JSON.parse(JSON.stringify(state.map))];
      state.historyIndex = 0;
      
      // Set up canvas
      setupCanvas(canvas, state.map[0].length, state.map.length, state.tileSize);
      
      // Draw loaded map
      redrawCanvas();
    }
  });
}

// Update theme color based on selected theme
function updateThemeColor() {
  if (state.theme === 'Classic Dungeon') {
    state.themeColor = '#000000'; // Black
  } else if (state.theme === 'Old School Blue Dungeon') {
    state.themeColor = '#5692ba'; // Blue
  }
}

// Populate asset list based on selected theme
function populateAssetList() {
  const assets = getAssetsByTheme(state.assets, state.theme);
  assetList.innerHTML = '';
  
  assets.forEach(asset => {
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';
    assetItem.dataset.asset = asset.name;
    
    const img = document.createElement('img');
    img.src = asset.path;
    img.alt = asset.name;
    
    const span = document.createElement('span');
    // Remove 1x1 suffix and convert camelCase to space-separated words
    span.textContent = asset.name
      .replace(/\d+x\d+$/, '') // Remove 1x1, 2x2, etc.
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^\s+/, '') // Remove leading space
      .trim();
      
    // Add size indicator for multi-tile assets
    if (asset.width > 1 || asset.height > 1) {
      const sizeIndicator = document.createElement('div');
      sizeIndicator.className = 'size-indicator';
      sizeIndicator.textContent = `${asset.width}×${asset.height}`;
      assetItem.appendChild(sizeIndicator);
    }
    
    assetItem.appendChild(img);
    assetItem.appendChild(span);
    
    assetItem.addEventListener('click', () => {
      selectAsset(asset);
    });
    
    assetList.appendChild(assetItem);
  });
}

// Filter assets based on search input
function filterAssets() {
  const searchTerm = assetSearch.value.toLowerCase();
  const assetItems = assetList.querySelectorAll('.asset-item');
  
  assetItems.forEach(item => {
    const assetName = item.dataset.asset.toLowerCase();
    if (assetName.includes(searchTerm)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Select an asset
function selectAsset(asset) {
  state.selectedAsset = asset;
  
  // Reset rotation when selecting a new asset
  state.assetRotation = 0;
  updateRotationStatus();
  
  // Update UI
  const assetItems = assetList.querySelectorAll('.asset-item');
  assetItems.forEach(item => {
    if (item.dataset.asset === asset.name) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  // Switch to fill tool
  setActiveTool('fill');
}

// Set active tool
function setActiveTool(toolId) {
  state.selectedTool = toolId;
  
  // Update UI
  for (const id in toolButtons) {
    if (id === toolId) {
      toolButtons[id].classList.add('active');
    } else {
      toolButtons[id].classList.remove('active');
    }
  }
}

// Set active edge type
function setActiveEdgeType(edgeId) {
  state.selectedEdgeType = edgeId;
  
  // Update UI
  for (const id in edgeButtons) {
    if (id === edgeId) {
      edgeButtons[id].classList.add('active');
    } else {
      edgeButtons[id].classList.remove('active');
    }
  }
  
  // Switch to edge tool
  setActiveTool('edge');
}

// Set up canvas event listeners
function setupCanvasEventListeners() {
  let isDrawing = false;
  
  // Mouse down event
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / state.tileSize / state.zoomLevel);
    const y = Math.floor((e.clientY - rect.top) * scaleY / state.tileSize / state.zoomLevel);
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse button or Alt+Left click
      state.isPanning = true;
      state.lastPanPoint = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      return;
    }
    
    if (x < 0 || x >= state.map[0].length || y < 0 || y >= state.map.length) {
      return;
    }
    
    isDrawing = true;
    
    if (state.selectedTool === 'select') {
      state.selection.active = true;
      state.selection.startX = x;
      state.selection.startY = y;
      state.selection.endX = x;
      state.selection.endY = y;
    } else if (state.selectedTool === 'fill') {
      saveToHistory();
      
      if (state.selectedAsset) {
        // Check if multi-tile asset fits
        let assetWidth = state.selectedAsset.width || 1;
        let assetHeight = state.selectedAsset.height || 1;
        
        // For 90 or 270 degree rotations, swap width and height
        if (state.assetRotation === 90 || state.assetRotation === 270) {
          [assetWidth, assetHeight] = [assetHeight, assetWidth];
        }
        
        // Check if the asset would exceed map boundaries
        if (x + assetWidth > state.map[0].length || y + assetHeight > state.map.length) {
          // Asset doesn't fit, show alert and return
          alert(`This asset needs ${assetWidth}x${assetHeight} tiles of space, which exceeds the map boundaries at this position.`);
          return;
        }
        
        // Place the asset in the top-left tile with current rotation
        state.map[y][x].type = 'asset';
        state.map[y][x].asset = state.selectedAsset.name;
        state.map[y][x].rotation = state.assetRotation;
        
        // Mark other tiles as empty to prevent drawing in them
        // This ensures the multi-tile asset is visible
        for (let offsetY = 0; offsetY < assetHeight; offsetY++) {
          for (let offsetX = 0; offsetX < assetWidth; offsetX++) {
            // Skip the top-left tile as it's already set
            if (offsetX === 0 && offsetY === 0) continue;
            
            // Clear other tiles that will be covered by this asset
            clearTile(state.map, x + offsetX, y + offsetY);
          }
        }
      } else {
        state.map[y][x].type = 'fill';
        state.map[y][x].asset = null;
      }
    } else if (state.selectedTool === 'empty') {
      saveToHistory();
      clearTile(state.map, x, y);
    } else if (state.selectedTool === 'edge') {
      saveToHistory();
      
      // Determine which edge was clicked
      const tileX = x * state.tileSize * state.zoomLevel;
      const tileY = y * state.tileSize * state.zoomLevel;
      const clickX = (e.clientX - rect.left) * scaleX / state.zoomLevel;
      const clickY = (e.clientY - rect.top) * scaleY / state.zoomLevel;
      
      const relX = clickX - tileX;
      const relY = clickY - tileY;
      
      let edge = null;
      
      if (relY < relX && relY < state.tileSize - relX) {
        if (relY < state.tileSize / 4) edge = 'top';
      } else if (relY > relX && relY > state.tileSize - relX) {
        if (relY > state.tileSize * 3/4) edge = 'bottom';
      } else if (relY < relX && relY > state.tileSize - relX) {
        if (relX > state.tileSize * 3/4) edge = 'right';
      } else if (relY > relX && relY < state.tileSize - relX) {
        if (relX < state.tileSize / 4) edge = 'left';
      }
      
      if (edge) {
        if (state.map[y][x].edges[edge] === state.selectedEdgeType) {
          state.map[y][x].edges[edge] = null; // Toggle off if same edge type
        } else {
          state.map[y][x].edges[edge] = state.selectedEdgeType;
        }
        
        // Also update the adjacent tile's edge
        if (edge === 'top' && y > 0) {
          if (state.map[y-1][x].edges.bottom === state.selectedEdgeType) {
            state.map[y-1][x].edges.bottom = null;
          } else if (state.map[y][x].edges.top) {
            state.map[y-1][x].edges.bottom = state.selectedEdgeType;
          }
        } else if (edge === 'right' && x < state.map[0].length - 1) {
          if (state.map[y][x+1].edges.left === state.selectedEdgeType) {
            state.map[y][x+1].edges.left = null;
          } else if (state.map[y][x].edges.right) {
            state.map[y][x+1].edges.left = state.selectedEdgeType;
          }
        } else if (edge === 'bottom' && y < state.map.length - 1) {
          if (state.map[y+1][x].edges.top === state.selectedEdgeType) {
            state.map[y+1][x].edges.top = null;
          } else if (state.map[y][x].edges.bottom) {
            state.map[y+1][x].edges.top = state.selectedEdgeType;
          }
        } else if (edge === 'left' && x > 0) {
          if (state.map[y][x-1].edges.right === state.selectedEdgeType) {
            state.map[y][x-1].edges.right = null;
          } else if (state.map[y][x].edges.left) {
            state.map[y][x-1].edges.right = state.selectedEdgeType;
          }
        }
      }
    }
    
    redrawCanvas();
  });
  
  // Mouse move event
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle panning
    if (state.isPanning) {
      const deltaX = e.clientX - state.lastPanPoint.x;
      const deltaY = e.clientY - state.lastPanPoint.y;
      
      const canvasContainer = document.querySelector('.canvas-container');
      canvasContainer.scrollLeft -= deltaX;
      canvasContainer.scrollTop -= deltaY;
      
      state.lastPanPoint = { x: e.clientX, y: e.clientY };
      return;
    }
    
    if (!isDrawing) {
      return;
    }
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / state.tileSize / state.zoomLevel);
    const y = Math.floor((e.clientY - rect.top) * scaleY / state.tileSize / state.zoomLevel);
    
    if (x < 0 || x >= state.map[0].length || y < 0 || y >= state.map.length) {
      return;
    }
    
    if (state.selectedTool === 'select') {
      state.selection.endX = x;
      state.selection.endY = y;
    } else if (state.selectedTool === 'fill') {
      if (state.selectedAsset) {
        // Check if multi-tile asset fits
        let assetWidth = state.selectedAsset.width || 1;
        let assetHeight = state.selectedAsset.height || 1;
        
        // For 90 or 270 degree rotations, swap width and height
        if (state.assetRotation === 90 || state.assetRotation === 270) {
          [assetWidth, assetHeight] = [assetHeight, assetWidth];
        }
        
        // Check if the asset would exceed map boundaries
        if (x + assetWidth > state.map[0].length || y + assetHeight > state.map.length) {
          return; // Asset doesn't fit, skip placement
        }
        
        // Place the asset in the top-left tile with current rotation
        state.map[y][x].type = 'asset';
        state.map[y][x].asset = state.selectedAsset.name;
        state.map[y][x].rotation = state.assetRotation;
        
        // Mark other tiles as empty to prevent drawing in them
        for (let offsetY = 0; offsetY < assetHeight; offsetY++) {
          for (let offsetX = 0; offsetX < assetWidth; offsetX++) {
            // Skip the top-left tile as it's already set
            if (offsetX === 0 && offsetY === 0) continue;
            
            // Clear other tiles that will be covered by this asset
            clearTile(state.map, x + offsetX, y + offsetY);
          }
        }
      } else {
        state.map[y][x].type = 'fill';
        state.map[y][x].asset = null;
      }
    } else if (state.selectedTool === 'empty') {
      clearTile(state.map, x, y);
    }
    
    redrawCanvas();
  });
  
  // Mouse up event
  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    
    if (state.isPanning) {
      state.isPanning = false;
      canvas.style.cursor = 'default';
    }
  });
  
  // Mouse leave event
  canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
    
    if (state.isPanning) {
      state.isPanning = false;
      canvas.style.cursor = 'default';
    }
  });
  
  // Wheel event for zooming
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const delta = -Math.sign(e.deltaY) * 0.1;
    zoomCanvas(delta);
  });
  
  // Keyboard event listeners
  document.addEventListener('keydown', (e) => {
    // Undo: Ctrl+Z
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      undo();
    }
    
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      redo();
    }
    
    // Cut: Ctrl+X
    if (e.ctrlKey && e.key === 'x') {
      if (state.selection.active) {
        cutSelection();
      }
    }
    
    // Copy: Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
      if (state.selection.active) {
        copySelection();
      }
    }
    
    // Paste: Ctrl+V
    if (e.ctrlKey && e.key === 'v') {
      if (state.clipboard) {
        pasteSelection();
      }
    }
    
    // Delete: Delete key
    if (e.key === 'Delete') {
      if (state.selection.active) {
        deleteSelection();
      }
    }
    
    // Rotate: R key
    if (e.key === 'r' || e.key === 'R') {
      rotateAsset();
    }
    
    // Escape: Deselect
    if (e.key === 'Escape') {
      state.selection.active = false;
      redrawCanvas();
    }
  });
}

// Copy the current selection
function copySelection() {
  if (!state.selection.active || !state.map) return;
  
  const startX = Math.min(state.selection.startX, state.selection.endX);
  const startY = Math.min(state.selection.startY, state.selection.endY);
  const endX = Math.max(state.selection.startX, state.selection.endX);
  const endY = Math.max(state.selection.startY, state.selection.endY);
  
  const width = endX - startX + 1;
  const height = endY - startY + 1;
  
  state.clipboard = {
    width,
    height,
    data: []
  };
  
  for (let y = startY; y <= endY; y++) {
    const row = [];
    for (let x = startX; x <= endX; x++) {
      row.push(JSON.parse(JSON.stringify(state.map[y][x])));
    }
    state.clipboard.data.push(row);
  }
}

// Cut the current selection
function cutSelection() {
  copySelection();
  deleteSelection();
}

// Paste the clipboard content
function pasteSelection() {
  if (!state.clipboard || !state.map) return;
  
  saveToHistory();
  
  // Use current selection start as paste position, or default to 0,0
  const startX = state.selection.active ? Math.min(state.selection.startX, state.selection.endX) : 0;
  const startY = state.selection.active ? Math.min(state.selection.startY, state.selection.endY) : 0;
  
  // Update selection to match clipboard size
  state.selection.active = true;
  state.selection.startX = startX;
  state.selection.startY = startY;
  state.selection.endX = startX + state.clipboard.width - 1;
  state.selection.endY = startY + state.clipboard.height - 1;
  
  // Ensure we don't paste outside the map boundaries
  const endX = Math.min(startX + state.clipboard.width - 1, state.map[0].length - 1);
  const endY = Math.min(startY + state.clipboard.height - 1, state.map.length - 1);
  
  for (let y = startY, clipY = 0; y <= endY; y++, clipY++) {
    for (let x = startX, clipX = 0; x <= endX; x++, clipX++) {
      if (clipY < state.clipboard.data.length && clipX < state.clipboard.data[0].length) {
        state.map[y][x] = JSON.parse(JSON.stringify(state.clipboard.data[clipY][clipX]));
      }
    }
  }
  
  redrawCanvas();
}

// Delete the content of the current selection
function deleteSelection() {
  if (!state.selection.active || !state.map) return;
  
  saveToHistory();
  
  const startX = Math.min(state.selection.startX, state.selection.endX);
  const startY = Math.min(state.selection.startY, state.selection.endY);
  const endX = Math.max(state.selection.startX, state.selection.endX);
  const endY = Math.max(state.selection.startY, state.selection.endY);
  
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      clearTile(state.map, x, y);
    }
  }
  
  redrawCanvas();
}

// Zoom the canvas
function zoomCanvas(delta) {
  const newZoom = Math.max(0.25, Math.min(3, state.zoomLevel + delta));
  
  if (newZoom !== state.zoomLevel) {
    state.zoomLevel = newZoom;
    redrawCanvas();
  }
}

// Toggle grid visibility
function toggleGrid() {
  state.showGrid = !state.showGrid;
  redrawCanvas();
}

// Redraw the canvas
function redrawCanvas() {
  if (!state.map) return;
  
  const height = state.map.length;
  const width = state.map[0].length;
  
  // Resize canvas based on zoom level
  canvas.width = width * state.tileSize * state.zoomLevel;
  canvas.height = height * state.tileSize * state.zoomLevel;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Scale context based on zoom level
  ctx.save();
  ctx.scale(state.zoomLevel, state.zoomLevel);
  
  // Draw tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = state.map[y][x];
      
      // Draw tile background
      if (tile.type === 'fill') {
        drawTile(ctx, x, y, state.tileSize, state.themeColor);
      } else if (tile.type === 'asset' && tile.asset) {
        const asset = findAssetByName(state.assets, state.theme, tile.asset);
        if (asset) {
          // Pass the asset dimensions and rotation to drawTile
          drawTile(
            ctx, 
            x, 
            y, 
            state.tileSize, 
            null, 
            asset.path, 
            asset.width, 
            asset.height, 
            tile.rotation || 0
          );
        }
      }
      
      // Draw edges
      for (const edge in tile.edges) {
        if (tile.edges[edge]) {
          drawEdge(ctx, x, y, state.tileSize, edge, tile.edges[edge], state.themeColor);
        }
      }
    }
  }
  
  // Draw grid
  if (state.showGrid) {
    drawGrid(ctx, width, height, state.tileSize);
  }
  
  // Draw selection
  if (state.selection.active) {
    const startX = Math.min(state.selection.startX, state.selection.endX);
    const startY = Math.min(state.selection.startY, state.selection.endY);
    const selWidth = Math.abs(state.selection.endX - state.selection.startX) + 1;
    const selHeight = Math.abs(state.selection.endY - state.selection.startY) + 1;
    
    ctx.strokeStyle = 'rgba(0, 127, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      startX * state.tileSize,
      startY * state.tileSize,
      selWidth * state.tileSize,
      selHeight * state.tileSize
    );
    ctx.setLineDash([]);
  }
  
  ctx.restore();
}

// Save current state to history
function saveToHistory() {
  // If we're not at the end of history, remove future states
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }
  
  // Add current state to history
  state.history.push(JSON.parse(JSON.stringify(state.map)));
  state.historyIndex = state.history.length - 1;
  
  // Limit history size
  if (state.history.length > 50) {
    state.history.shift();
    state.historyIndex--;
  }
}

// Undo the last action
function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.map = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    redrawCanvas();
  }
}

// Redo the last undone action
function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.map = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    redrawCanvas();
  }
}

// Find asset by name
function findAssetByName(assets, theme, assetName) {
  const themeAssets = assets[theme];
  if (themeAssets) {
    return themeAssets.find(asset => asset.name === assetName);
  }
  return null;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export main functions for other modules
export {
  state,
  redrawCanvas
};