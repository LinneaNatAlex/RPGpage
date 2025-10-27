# Assets Directory Documentation

This directory contains all static assets used throughout the Harry Potter RPG application.

## Directory Structure

```
src/assets/
├── Cursor/
│   ├── magicalCursor.css     # CSS styles for magical cursor effects
│   └── magicalCursor.js      # JavaScript logic for magical cursor system
├── Variables/
│   └── Variables.css        # CSS custom properties (design tokens)
└── VideoBackgrounds/
    └── Train.mp4            # Background video animation

public/icons/
├── avatar.svg              # User avatar/profile icon
├── chest.svg               # Treasure chest/storage icon
├── gold-coin.svg           # Currency/gold coin icon
└── magic-school.svg        # Magical school/academy icon
```

## Asset Descriptions

### Cursor Effects (`src/assets/Cursor/`)

**magicalCursor.css**
- Contains all CSS styles for the magical cursor effect system
- Provides golden magical cursor with sparkle animations
- Includes trail particles and hover effects
- Mobile responsive (disabled on touch devices)
- Performance optimized animations

**magicalCursor.js**
- JavaScript logic for the magical cursor effect system
- Creates interactive cursor effects and particle system
- Handles mouse events and DOM manipulation
- Automatic cleanup for performance
- Mobile detection and accessibility support

### CSS Variables (`src/assets/Variables/`)

**Variables.css**
- CSS custom properties for consistent theming
- Design tokens for colors, fonts, spacing, animations
- Placeholder for future CSS variable definitions
- Enables easy theme switching and maintenance

### Video Backgrounds (`src/assets/VideoBackgrounds/`)

**Train.mp4**
- Background video animation for immersive UI
- Harry Potter themed moving train scene
- Optimized for web playback
- Used for dynamic page backgrounds

### Icons (`public/icons/`)

**avatar.svg**
- User avatar/profile picture icon
- Used in profile displays, chat, navigation
- Scalable vector graphic (~1.3KB)

**chest.svg**
- Treasure chest/storage container icon
- Used in inventory, shop, reward systems
- Scalable vector graphic (~552 bytes)

**gold-coin.svg**
- Currency/gold coin icon
- Used in payment, currency displays, rewards
- Scalable vector graphic (~398 bytes)

**magic-school.svg**
- Magical school/academy building icon
- Used in education interfaces, classrooms
- Scalable vector graphic (~786 bytes)

## Usage Guidelines

### CSS Files
- Import CSS files in components that need the styles
- Use CSS variables for consistent theming
- Follow mobile-first responsive design principles

### JavaScript Files
- Import and initialize magical cursor effects as needed
- Use provided export functions for control
- Consider performance impact on mobile devices

### SVG Icons
- Reference icons by filename in components
- Style with CSS (fill, stroke, size properties)
- Maintain aspect ratios when scaling

### Video Files
- Use for background effects only
- Consider bandwidth and performance impact
- Provide fallbacks for unsupported browsers

## Performance Considerations

- All assets are optimized for web use
- CSS animations use hardware acceleration
- SVG icons are scalable and lightweight
- Video files are compressed for web delivery
- Mobile devices have reduced effects for performance

## Accessibility

- Magical cursor effects can be disabled
- SVG icons maintain accessibility attributes
- Video backgrounds have proper fallbacks
- All assets follow WCAG guidelines

## Maintenance

- Update CSS variables for theme changes
- Optimize video files for better compression
- Ensure SVG icons maintain accessibility
- Test cursor effects across different browsers
- Monitor performance impact on mobile devices
