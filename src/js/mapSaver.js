// Map saver module for handling saving and loading maps

// Save map to local storage
function saveMap(map, theme, tileSize) {
  if (!map) {
    alert('No map to save');
    return;
  }
  
  try {
    // Create a data object with map data, theme, and tile size
    const mapData = {
      map,
      theme,
      tileSize,
      timestamp: new Date().toISOString()
    };
    
    // Ask for a name for the save
    const mapName = prompt('Enter a name for your map:', 'Dungeon Map');
    
    if (!mapName) {
      return; // User cancelled
    }
    
    // Get existing saved maps
    const savedMaps = JSON.parse(localStorage.getItem('mapmakerSavedMaps') || '{}');
    
    // Add the new map
    savedMaps[mapName] = mapData;
    
    // Save back to localStorage
    localStorage.setItem('mapmakerSavedMaps', JSON.stringify(savedMaps));
    
    // Offer to download as a file
    if (confirm('Map saved locally. Do you also want to download it as a file?')) {
      downloadMapAsFile(mapData, mapName);
    }
    
    alert('Map saved successfully');
  } catch (error) {
    console.error('Error saving map:', error);
    alert('Error saving map: ' + error.message);
  }
}

// Download map as a JSON file
function downloadMapAsFile(mapData, mapName) {
  const dataStr = JSON.stringify(mapData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(dataBlob);
  downloadLink.download = `${mapName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  
  // Append to body, click, and remove
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Load map from local storage or file
async function loadMap() {
  try {
    // Get existing saved maps
    const savedMaps = JSON.parse(localStorage.getItem('mapmakerSavedMaps') || '{}');
    
    // If no saved maps, prompt for file upload
    if (Object.keys(savedMaps).length === 0) {
      return loadMapFromFile();
    }
    
    // Create a selection list of saved maps
    const mapOptions = Object.keys(savedMaps).map(name => {
      const date = new Date(savedMaps[name].timestamp);
      return `<option value="${name}">${name} (${date.toLocaleString()})</option>`;
    }).join('');
    
    // Create a custom modal for selecting or uploading maps
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Load Map</h2>
        <div class="form-group">
          <label for="saved-maps">Select a saved map:</label>
          <select id="saved-maps" style="width: 100%;">
            ${mapOptions}
          </select>
        </div>
        <div class="form-group">
          <button id="load-from-storage" style="width: 100%;">Load Selected Map</button>
        </div>
        <div class="form-group" style="text-align: center;">
          <span>- OR -</span>
        </div>
        <div class="form-group">
          <label for="map-file">Load from file:</label>
          <input type="file" id="map-file" accept=".json">
        </div>
        <div class="modal-buttons">
          <button id="load-cancel">Cancel</button>
          <button id="load-from-file">Load File</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Create a promise that will be resolved when a map is selected
    return new Promise((resolve, reject) => {
      // Load from storage button
      document.getElementById('load-from-storage').addEventListener('click', () => {
        const selectedName = document.getElementById('saved-maps').value;
        const mapData = savedMaps[selectedName];
        document.body.removeChild(modal);
        resolve(mapData);
      });
      
      // Load from file button
      document.getElementById('load-from-file').addEventListener('click', async () => {
        const fileInput = document.getElementById('map-file');
        
        if (fileInput.files.length === 0) {
          alert('Please select a file');
          return;
        }
        
        try {
          const mapData = await readMapFile(fileInput.files[0]);
          document.body.removeChild(modal);
          resolve(mapData);
        } catch (error) {
          alert('Error loading file: ' + error.message);
          reject(error);
        }
      });
      
      // Cancel button
      document.getElementById('load-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error loading map:', error);
    alert('Error loading map: ' + error.message);
    return null;
  }
}

// Load map from file
function loadMapFromFile() {
  return new Promise((resolve, reject) => {
    // Create a file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    // Append to body
    document.body.appendChild(fileInput);
    
    // Set up load event
    fileInput.addEventListener('change', async () => {
      if (fileInput.files.length === 0) {
        document.body.removeChild(fileInput);
        resolve(null);
        return;
      }
      
      try {
        const mapData = await readMapFile(fileInput.files[0]);
        document.body.removeChild(fileInput);
        resolve(mapData);
      } catch (error) {
        document.body.removeChild(fileInput);
        alert('Error loading file: ' + error.message);
        reject(error);
      }
    });
    
    // Set up cancel event
    fileInput.addEventListener('cancel', () => {
      document.body.removeChild(fileInput);
      resolve(null);
    });
    
    // Trigger file dialog
    fileInput.click();
  });
}

// Read map file
function readMapFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const mapData = JSON.parse(event.target.result);
        resolve(mapData);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

// Export the map as a PNG image
function exportPNG(canvas) {
  try {
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = canvas.toDataURL('image/png');
    
    // Ask for a name for the file
    const fileName = prompt('Enter a name for your map image:', 'Dungeon Map');
    
    if (!fileName) {
      return; // User cancelled
    }
    
    downloadLink.download = `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    
    // Append to body, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
  } catch (error) {
    console.error('Error exporting PNG:', error);
    alert('Error exporting PNG: ' + error.message);
  }
}

// Export functions
export {
  saveMap,
  loadMap,
  exportPNG
};