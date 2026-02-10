# Assets Directory Documentation

This directory contains all static assets used throughout the Harry Potter RPG application.

## Directory Structure

```
src/assets/
└── Variables/
    └── Variables.css        # CSS custom properties (design tokens)

public/icons/
├── avatar.svg              # User avatar/profile icon
├── chest.svg               # Treasure chest/storage icon
├── gold-coin.svg           # Currency/gold coin icon
└── magic-school.svg        # Magical school/academy icon
```

## Asset Descriptions

### CSS Variables (`src/assets/Variables/`)

**Variables.css**
- CSS custom properties for consistent theming
- Design tokens for colors, fonts, spacing, animations
- Placeholder for future CSS variable definitions
- Enables easy theme switching and maintenance

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

### SVG Icons
- Reference icons by filename in components
- Style with CSS (fill, stroke, size properties)
- Maintain aspect ratios when scaling

## Performance Considerations

- All assets are optimized for web use
- CSS animations use hardware acceleration
- SVG icons are scalable and lightweight

## Accessibility

- SVG icons maintain accessibility attributes
- All assets follow WCAG guidelines

## Maintenance

- Update CSS variables for theme changes
- Ensure SVG icons maintain accessibility
