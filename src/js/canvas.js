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
    
    let drawWidth = tileSize * assetWidth;
    let drawHeight = tileSize * assetHeight;
    
    // Swap dimensions for 90 or 270 degree rotations
    // This ensures rectangular tiles change shape appropriately
    let effectiveWidth = assetWidth;
    let effectiveHeight = assetHeight;
    
    if (rotation === 90 || rotation === 270) {
      // Swap effective dimensions for boundary and calculation purposes
      effectiveWidth = assetHeight;
      effectiveHeight = assetWidth;
    }
    
    // Draw with rotation if specified
    const drawRotatedImage = () => {
      ctx.save();
      
      if (rotation !== 0) {
        // For non-square tiles, we need to center differently
        // Calculate the center for rotation
        const centerTileX = tileX + (effectiveWidth * tileSize) / 2;
        const centerTileY = tileY + (effectiveHeight * tileSize) / 2;
        
        // Convert rotation to radians
        const rotationRad = (rotation * Math.PI) / 180;
        
        // Translate to center, rotate
        ctx.translate(centerTileX, centerTileY);
        ctx.rotate(rotationRad);
        
        // Draw based on rotation
        if (rotation === 90 || rotation === 270) {
          // Draw the rotated image with swapped dimensions
          ctx.drawImage(
            img,
            -drawHeight / 2, // X offset for rotated image
            -drawWidth / 2,  // Y offset for rotated image
            drawHeight,      // Swapped width
            drawWidth        // Swapped height
          );
        } else {
          // 180 degrees - no dimension swapping needed
          ctx.drawImage(
            img,
            -drawWidth / 2,  // X offset
            -drawHeight / 2, // Y offset
            drawWidth,
            drawHeight
          );
        }
      } else {
        // No rotation, draw normally
        ctx.drawImage(img, tileX, tileY, drawWidth, drawHeight);
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
  map[y][x] = {
    type: 'empty',
    asset: null,
    edges: {
      top: map[y][x].edges.top,
      right: map[y][x].edges.right,
      bottom: map[y][x].edges.bottom,
      left: map[y][x].edges.left
    }
  };
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