# MapMaker - AD&D 2nd Edition Style Dungeon Map Creator

MapMaker is a Progressive Web Application (PWA) for creating dungeon maps in the style of AD&D 2nd edition. It provides a simple, intuitive interface for placing tiles, drawing edges, and creating detailed dungeon layouts.

## Features

- Create maps with customizable tile sizes (16x16 to 64x64)
- Choose from multiple dungeon themes (Classic Black and White, Old School Blue)
- Place and rotate assets like tables, chairs, doors, and more
- Draw different edge types (walls, cracked walls, doors, windows, secret doors, etc.)
- Save and load maps locally or as files
- Export maps as PNG images
- Works offline as a Progressive Web App
- Mobile-friendly responsive design

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Configure your map size and theme
4. Click "Create Map" to get started

## Usage

### Interface Controls

- **Tools**:
  - **Select**: Select areas of the map
  - **Fill**: Place assets or fill tiles
  - **Empty**: Clear tiles
  - **Edge**: Draw walls and other edge elements

- **Edge Types**:
  - Wall
  - Cracked Wall
  - Door
  - Window
  - Secret Door (S)
  - Trap (T)
  - Lever (L)

- **Keyboard Shortcuts**:
  - **R**: Rotate selected asset
  - **Ctrl+Z**: Undo
  - **Ctrl+Y** or **Ctrl+Shift+Z**: Redo
  - **Ctrl+C**: Copy selection
  - **Ctrl+X**: Cut selection
  - **Ctrl+V**: Paste selection
  - **Delete**: Delete selection
  - **Escape**: Cancel selection

### Mouse Controls

- **Left Click**: Place assets, draw edges, or select areas
- **Middle Click** or **Alt+Left Click**: Pan the map
- **Mouse Wheel**: Zoom in/out

## Map Management

- **File Menu**:
  - **New Map**: Create a new map with specified dimensions
  - **Open Map**: Load a previously saved map
  - **Save Map**: Save the current map to browser storage or as a file
  - **Export as PNG**: Export the map as a PNG image

## Technical Details

MapMaker is built using vanilla JavaScript, HTML5 Canvas, and CSS. It leverages modern browser features to provide a responsive and intuitive interface.

- **Canvas API**: Used for drawing the map and assets
- **Local Storage**: For saving maps in the browser
- **File API**: For importing/exporting map files
- **Service Worker**: For offline functionality

## Asset System

Assets are categorized by theme and can have varying dimensions (1x1, 2x1, etc.). When rotated, the application properly handles the dimensional changes (e.g., a 2x1 table becomes 1x2 when rotated 90°).

## Future Enhancements

- Add more themes and asset packs
- Implement layer system for more complex maps
- Add text annotations for rooms/areas
- Provide a grid coordinate system
- Support for hex-based maps