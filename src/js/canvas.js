// Canvas module for handling drawing operations

// Initialize canvas
function initCanvas(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d');
}

// Set up canvas for a new map
function setupCanvas(canvas, mapWidth, mapHeight, tileSize) {
  canvas.width = mapWidth * tileSize;
  canvas.height = mapHeight * tileSize;
  return canvas.getContext('2d');
}

// Draw the grid
function drawGrid(ctx, width, height, tileSize) {
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 0.5;
  
  // Draw vertical lines
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileSize, 0);
    ctx.lineTo(x * tileSize, height * tileSize);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileSize);
    ctx.lineTo(width * tileSize, y * tileSize);
    ctx.stroke();
  }
}

// Draw a tile
function drawTile(ctx, x, y, tileSize, fillColor, assetPath, assetWidth = 1, assetHeight = 1, rotation = 0) {
  const tileX = x * tileSize;
  const tileY = y * tileSize;
  
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
  } else if (assetPath) {
    const img = new Image();
    img.src = assetPath;
    
    // Calculate the original and rotated dimensions
    const originalWidth = assetWidth * tileSize;
    const originalHeight = assetHeight * tileSize;
    
    // Function to draw the image with rotation
    const drawRotatedImage = () => {
      // For non-rotated images, draw normally
      if (rotation === 0) {
        ctx.drawImage(img, tileX, tileY, originalWidth, originalHeight);
        return;
      }
      
      // For rotated images, use a more complex approach
      ctx.save();
      
      // Calculate the center point of the image
      const centerX = tileX + originalWidth / 2;
      const centerY = tileY + originalHeight / 2;
      
      // Move to the center, rotate, then draw
      ctx.translate(centerX, centerY);
      const rad = rotation * Math.PI / 180;
      ctx.rotate(rad);
      
      // Draw the image centered at the origin (which is now centerX, centerY in the canvas)
      if (rotation === 90 || rotation === 270) {
        // For 90° and 270° rotations, swap the width and height
        ctx.drawImage(img, -originalHeight / 2, -originalWidth / 2, originalHeight, originalWidth);
      } else {
        // For 180° rotation, keep the same dimensions
        ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
      }
      
      ctx.restore();
    };
    
    // Use a closure to ensure the image is drawn only after loading
    img.onload = drawRotatedImage;
    
    // For already loaded images, draw immediately
    if (img.complete) {
      drawRotatedImage();
    }
  } else {
    // Empty tile (white background)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
  }
}

// Draw an edge on a tile
function drawEdge(ctx, x, y, tileSize, edgePosition, edgeType, color) {
  const tileX = x * tileSize;
  const tileY = y * tileSize;
  
  ctx.strokeStyle = color || '#000000';
  
  switch (edgeType) {
    case 'wall':
      drawWallEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
    case 'cracked':
      drawCrackedWallEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
    case 'door':
      drawDoorEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
    case 'window':
      drawWindowEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
    case 'secret':
      drawSecretDoorEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
    case 'trap':
      drawTrapEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
    case 'lever':
      drawLeverEdge(ctx, tileX, tileY, tileSize, edgePosition);
      break;
  }
}

// Clear a tile (set to empty)
function clearTile(map, x, y) {
  // Check if this is a primary asset tile that has other blocked tiles
  if (map[y][x].type === 'asset' && 
      (map[y][x].placementWidth > 1 || map[y][x].placementHeight > 1)) {
    
    const width = map[y][x].placementWidth || 1;
    const height = map[y][x].placementHeight || 1;
    
    // Clear all blocked tiles that belong to this asset
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        // Skip out-of-bounds checks
        if (y + dy >= map.length || x + dx >= map[0].length) continue;
        
        // Clear each tile while preserving edges
        map[y + dy][x + dx] = {
          type: 'empty',
          asset: null,
          edges: {
            top: map[y + dy][x + dx].edges?.top || null,
            right: map[y + dy][x + dx].edges?.right || null,
            bottom: map[y + dy][x + dx].edges?.bottom || null,
            left: map[y + dy][x + dx].edges?.left || null
          }
        };
      }
    }
  } 
  // If it's a blocked tile, find and clear the parent asset
  else if (map[y][x].type === 'blocked' && map[y][x].blockedBy) {
    const parentX = map[y][x].blockedBy.x;
    const parentY = map[y][x].blockedBy.y;
    
    // Make sure the parent is within bounds
    if (parentY < map.length && parentX < map[0].length) {
      // Recursively clear the parent tile, which will also clear other blocked tiles
      clearTile(map, parentX, parentY);
    } else {
      // If parent is out of bounds, just clear this tile
      map[y][x] = {
        type: 'empty',
        asset: null,
        edges: {
          top: map[y][x].edges?.top || null,
          right: map[y][x].edges?.right || null,
          bottom: map[y][x].edges?.bottom || null,
          left: map[y][x].edges?.left || null
        }
      };
    }
  }
  // Otherwise just clear this single tile
  else {
    map[y][x] = {
      type: 'empty',
      asset: null,
      edges: {
        top: map[y][x].edges?.top || null,
        right: map[y][x].edges?.right || null,
        bottom: map[y][x].edges?.bottom || null,
        left: map[y][x].edges?.left || null
      }
    };
  }
}

// Draw a wall edge
function drawWallEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  switch (edgePosition) {
    case 'top':
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      break;
    case 'right':
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      break;
    case 'bottom':
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      break;
    case 'left':
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      break;
  }
  
  ctx.stroke();
}

// Draw a cracked wall edge
function drawCrackedWallEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.setLineDash([5, 3]);
  
  switch (edgePosition) {
    case 'top':
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      break;
    case 'right':
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      break;
    case 'bottom':
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      break;
    case 'left':
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      break;
  }
  
  ctx.stroke();
  ctx.setLineDash([]);
}

// Draw a door edge
function drawDoorEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 3;
  
  switch (edgePosition) {
    case 'top':
      // Draw the door line
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      ctx.stroke();
      
      // Draw the door swing arc
      ctx.beginPath();
      ctx.arc(tileX + tileSize / 2, tileY + tileSize / 4, tileSize / 4, Math.PI, 0, false);
      ctx.stroke();
      break;
    case 'right':
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(tileX + tileSize * 3/4, tileY + tileSize / 2, tileSize / 4, Math.PI * 1.5, Math.PI * 0.5, false);
      ctx.stroke();
      break;
    case 'bottom':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(tileX + tileSize / 2, tileY + tileSize * 3/4, tileSize / 4, 0, Math.PI, false);
      ctx.stroke();
      break;
    case 'left':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(tileX + tileSize / 4, tileY + tileSize / 2, tileSize / 4, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.stroke();
      break;
  }
}

// Draw a window edge
function drawWindowEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 2;
  
  const segmentSize = tileSize / 5;
  
  switch (edgePosition) {
    case 'top':
      // Draw the main line
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      ctx.stroke();
      
      // Draw window bars
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(tileX + segmentSize * i, tileY);
        ctx.lineTo(tileX + segmentSize * i, tileY + segmentSize);
        ctx.stroke();
      }
      break;
    case 'right':
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(tileX + tileSize, tileY + segmentSize * i);
        ctx.lineTo(tileX + tileSize - segmentSize, tileY + segmentSize * i);
        ctx.stroke();
      }
      break;
    case 'bottom':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(tileX + segmentSize * i, tileY + tileSize);
        ctx.lineTo(tileX + segmentSize * i, tileY + tileSize - segmentSize);
        ctx.stroke();
      }
      break;
    case 'left':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      ctx.stroke();
      
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(tileX, tileY + segmentSize * i);
        ctx.lineTo(tileX + segmentSize, tileY + segmentSize * i);
        ctx.stroke();
      }
      break;
  }
}

// Draw a secret door edge
function drawSecretDoorEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  
  switch (edgePosition) {
    case 'top':
      // Draw the dashed line
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      ctx.stroke();
      
      // Draw the 'S' marker
      ctx.setLineDash([]);
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('S', tileX + tileSize / 2, tileY + tileSize / 4);
      break;
    case 'right':
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('S', tileX + tileSize * 3/4, tileY + tileSize / 2);
      break;
    case 'bottom':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('S', tileX + tileSize / 2, tileY + tileSize * 3/4);
      break;
    case 'left':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('S', tileX + tileSize / 4, tileY + tileSize / 2);
      break;
  }
  
  ctx.setLineDash([]);
}

// Draw a trap edge
function drawTrapEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 2;
  
  switch (edgePosition) {
    case 'top':
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      ctx.stroke();
      
      // Draw the trap marker
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('T', tileX + tileSize / 2, tileY + tileSize / 4);
      break;
    case 'right':
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('T', tileX + tileSize * 3/4, tileY + tileSize / 2);
      break;
    case 'bottom':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('T', tileX + tileSize / 2, tileY + tileSize * 3/4);
      break;
    case 'left':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      ctx.stroke();
      
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('T', tileX + tileSize / 4, tileY + tileSize / 2);
      break;
  }
}

// Draw a lever edge
function drawLeverEdge(ctx, tileX, tileY, tileSize, edgePosition) {
  ctx.lineWidth = 2;
  
  switch (edgePosition) {
    case 'top':
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX + tileSize, tileY);
      ctx.stroke();
      
      // Draw the 'L' marker
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('L', tileX + tileSize / 2, tileY + tileSize / 4);
      break;
      
    case 'right':
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize, tileY);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      // Draw the 'L' marker
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('L', tileX + tileSize * 3/4, tileY + tileSize / 2);
      break;
      
    case 'bottom':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY + tileSize);
      ctx.lineTo(tileX + tileSize, tileY + tileSize);
      ctx.stroke();
      
      // Draw the 'L' marker
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('L', tileX + tileSize / 2, tileY + tileSize * 3/4);
      break;
      
    case 'left':
      ctx.beginPath();
      ctx.moveTo(tileX, tileY);
      ctx.lineTo(tileX, tileY + tileSize);
      ctx.stroke();
      
      // Draw the 'L' marker
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText('L', tileX + tileSize / 4, tileY + tileSize / 2);
      break;
  }
}

// Export functions
export {
  initCanvas,
  setupCanvas,
  drawGrid,
  drawTile,
  drawEdge,
  clearTile
};