// Asset manager module for handling assets

// Load all assets from the themes
async function loadAssets() {
  const assets = {};
  
  try {
    // Load Classic Dungeon assets
    assets['Classic Dungeon'] = await loadThemeAssets('Classic Dungeon');
    
    // Load Old School Blue Dungeon assets
    assets['Old School Blue Dungeon'] = await loadThemeAssets('Old School Blue Dungeon');
    
    return assets;
  } catch (error) {
    console.error('Error loading assets:', error);
    return {};
  }
}

// Load assets for a specific theme
async function loadThemeAssets(themeName) {
  const themeAssets = [];
  
  try {
    // Fetch list of assets in the theme directory
    const response = await fetch(`/src/assets/${themeName}/index.json`);
    
    // If the index.json file exists, use it to load assets
    if (response.ok) {
      const index = await response.json();
      
      index.files.forEach(file => {
        themeAssets.push({
          name: file.name,
          path: `/src/assets/${themeName}/${file.filename}`,
          width: file.width || 1,
          height: file.height || 1
        });
      });
    } else {
      // Otherwise, use the hard-coded asset list
      // This is a fallback in case the index.json doesn't exist
      
      // Get the base asset list from the theme's directory structure
      const baseAssets = getDefaultAssetList(themeName);
      
      baseAssets.forEach(assetName => {
        themeAssets.push({
          name: assetName,
          path: `/src/assets/${themeName}/${assetName}.png`,
          width: 1,
          height: 1
        });
      });
    }
    
    return themeAssets;
  } catch (error) {
    console.error(`Error loading assets for theme ${themeName}:`, error);
    return getHardcodedAssetList(themeName);
  }
}

// Get default asset list from theme name
function getDefaultAssetList(themeName) {
  // This function would normally scan the directory,
  // but since we're in a browser environment, we'll use a hard-coded list
  return [
    'Altar1x1',
    'Arrow1x1',
    'Bed1x1',
    'BedDouble1x1',
    'Bench1x1',
    'Bookcase1x1',
    'Cage1x1',
    'Cask1x1',
    'Chair1x1',
    'Chest1x1',
    'Circle1x1',
    'CircleDotted1x1',
    'CircleFilled1x1',
    'CoffinClosed1x1',
    'CoffinOpen1x1',
    'Cross1x1',
    'Curtain1x1',
    'CurtainCorner1x1',
    'Danger1x1',
    'Door1x1',
    'DoorArchway1x1',
    'DoorConcealed1x1',
    'DoorDouble1x1',
    'DoorFalse1x1',
    'DoorGate1x1',
    'DoorLocked1x1',
    'DoorMagic1x1',
    'DoorPortcullis1x1',
    'DoorRevolve1way1x1',
    'DoorRevolving1x1',
    'DoorSecret1x1',
    'DoorSlides1x1',
    'Fire1x1',
    'FireCamp1x1',
    'Fireplace1x1',
    'Fountain1x1',
    'Grave1x1',
    'Illusion1x1',
    'Key1x1',
    'LadderDown1x1',
    'LadderUp1x1',
    'Light1x1',
    'Loot1x1',
    'Lounge1x1',
    'PitCircle1x1',
    'PitClosedCircle1x1',
    'PitClosedSquare1x1',
    'PitSquare1x1',
    'Railing1x1',
    'RailingCorner1x1',
    'RailingCurve1x1',
    'RailingHalf1x1',
    'Square1x1',
    'SquareDotted1x1',
    'SquareFilled1x1',
    'StairSpiralCircleBig2x2',
    'StairSpiralCircleDown1x1',
    'StairSpiralCircleUp1x1',
    'StairSpiralSquareBig2x2',
    'StairSpiralSquareDown1x1',
    'StairSpiralSquareUp1x1',
    'Stairs1x1_01',
    'Statue1x1',
    'StatueSmall1x1',
    'Stool1x1',
    'TableLong2x1',
    'TableRectangle1x1',
    'TableRound1x1',
    'TableSet2x1',
    'TableSet3x1',
    'TableSetCircle1x1',
    'TableSetRect2x1',
    'TableSetSquare1x1',
    'TableSetTwo3x1',
    'TableSquare1x1',
    'Throne1x1',
    'Trap1x1',
    'TrapdoorCieling1x1',
    'TrapdoorFloor1x1',
    'TrapdoorSecret1x1',
    'TriangleArrowhead1x1',
    'Trigger1x1',
    'Unknown1x1',
    'WellCircle1x1',
    'WellSquare1x1',
    'Window1x1'
  ];
}

// Get hard-coded asset list if loading fails
function getHardcodedAssetList(themeName) {
  const assetNames = getDefaultAssetList(themeName);
  
  return assetNames.map(assetName => ({
    name: assetName,
    path: `/src/assets/${themeName}/${assetName}.png`,
    width: 1,
    height: 1
  }));
}

// Get assets by theme
function getAssetsByTheme(assets, themeName) {
  return assets[themeName] || [];
}

// Preload assets to ensure they're cached
function preloadAssets(assetList) {
  assetList.forEach(asset => {
    const img = new Image();
    img.src = asset.path;
  });
}

// Export functions
export {
  loadAssets,
  getAssetsByTheme,
  preloadAssets
};