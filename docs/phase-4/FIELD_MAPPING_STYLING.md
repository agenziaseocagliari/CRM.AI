# Field Mapping UI - Styling Guide

**Phase 4.1 - Task 3**: Design system and styling specifications

---

## DESIGN TOKENS

### Color Palette

#### Status Colors
```css
/* Mapping Status Colors */
--status-mapped: #10B981;        /* Green - Successfully mapped */
--status-unmapped: #6B7280;      /* Gray - Not mapped yet */
--status-warning: #F59E0B;       /* Amber - Mapped with warnings */
--status-error: #EF4444;         /* Red - Error/required missing */
--status-processing: #3B82F6;    /* Blue - Currently processing */

/* Confidence Level Colors */
--confidence-high: #10B981;      /* 90%+ confidence - solid green */
--confidence-medium: #F59E0B;    /* 70-89% - amber */
--confidence-low: #EF4444;       /* <70% - light red */
--confidence-override: #3B82F6;  /* Manual override - blue accent */

/* Interactive Colors */
--drag-active: #3B82F6;          /* Blue - Active drag state */
--drop-valid: #10B981;           /* Green - Valid drop zone */
--drop-invalid: #EF4444;         /* Red - Invalid drop zone */
--drop-hover: #F3F4F6;           /* Light gray - Hover state */

/* Background Colors */
--bg-primary: #FFFFFF;           /* Main background */
--bg-secondary: #F9FAFB;         /* Panel backgrounds */
--bg-tertiary: #F3F4F6;          /* Section dividers */
--bg-accent: #EEF2FF;            /* Highlight areas */
```

#### Semantic Colors
```css
/* Text Colors */
--text-primary: #111827;         /* Main text */
--text-secondary: #6B7280;       /* Secondary text */
--text-muted: #9CA3AF;           /* Muted text */
--text-inverse: #FFFFFF;         /* Text on dark backgrounds */

/* Border Colors */
--border-primary: #E5E7EB;       /* Default borders */
--border-secondary: #D1D5DB;     /* Subtle borders */
--border-focus: #3B82F6;         /* Focus indicators */
--border-error: #EF4444;         /* Error borders */
--border-success: #10B981;       /* Success borders */

/* Shadow Colors */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-drag: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

### Typography Scale

#### Font Families
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### Font Sizes & Line Heights
```css
/* Font Scale (1.125 ratio) */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Component Typography
```css
/* Component-specific typography */
.field-mapping-interface {
  --heading-primary: var(--text-2xl) var(--font-semibold);
  --heading-secondary: var(--text-lg) var(--font-medium);
  --body-text: var(--text-base) var(--font-normal);
  --caption-text: var(--text-sm) var(--font-normal);
  --label-text: var(--text-sm) var(--font-medium);
  --code-text: var(--text-sm) var(--font-mono);
}
```

---

### Spacing System

#### Base Scale (8px grid)
```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
```

#### Component Spacing
```css
.field-mapping-interface {
  /* Panel spacing */
  --panel-padding: var(--spacing-6);
  --panel-gap: var(--spacing-4);
  
  /* Item spacing */
  --item-padding: var(--spacing-4);
  --item-margin: var(--spacing-2);
  
  /* Button spacing */
  --button-padding-x: var(--spacing-4);
  --button-padding-y: var(--spacing-2);
  
  /* Input spacing */
  --input-padding: var(--spacing-3);
}
```

---

### Layout & Sizing

#### Container Sizes
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

#### Component Dimensions
```css
.field-mapping-interface {
  /* Panel dimensions */
  --csv-panel-width: 320px;
  --db-panel-width: 360px;
  --preview-height: 300px;
  --summary-height: 80px;
  
  /* Item dimensions */
  --column-item-height: 80px;
  --field-item-height: 72px;
  --drag-handle-size: 24px;
  
  /* Interactive elements */
  --button-height: 40px;
  --input-height: 36px;
  --badge-height: 24px;
}
```

---

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-full: 9999px;   /* Fully rounded */

/* Component-specific radius */
.field-mapping-interface {
  --panel-radius: var(--radius-lg);
  --item-radius: var(--radius-md);
  --button-radius: var(--radius-md);
  --badge-radius: var(--radius-full);
}
```

---

### Animation & Transitions

#### Timing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

#### Duration Scale
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

#### Component Transitions
```css
.field-mapping-interface {
  /* Hover transitions */
  --hover-transition: all var(--duration-150) var(--ease-out);
  
  /* Drag transitions */
  --drag-transition: transform var(--duration-200) var(--ease-out);
  
  /* State transitions */
  --state-transition: all var(--duration-300) var(--ease-in-out);
  
  /* Layout transitions */
  --layout-transition: all var(--duration-500) var(--ease-in-out);
}
```

---

### Responsive Breakpoints

```css
/* Mobile-first breakpoints */
--bp-sm: 640px;   /* Small tablets */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Small desktops */
--bp-xl: 1280px;  /* Large desktops */
--bp-2xl: 1536px; /* Very large screens */

/* Component breakpoints */
.field-mapping-interface {
  --mobile-max: 767px;
  --tablet-min: 768px;
  --tablet-max: 1023px;
  --desktop-min: 1024px;
}
```

---

## COMPONENT STYLING

### Main Interface Layout
```css
.field-mapping-interface {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  gap: var(--panel-gap);
  height: 100vh;
  background: var(--bg-primary);
  font-family: var(--font-primary);
  color: var(--text-primary);
}

/* Desktop layout */
@media (min-width: 1024px) {
  .mapping-panels {
    display: grid;
    grid-template-columns: var(--csv-panel-width) var(--db-panel-width);
    gap: var(--panel-gap);
  }
}

/* Tablet layout */
@media (max-width: 1023px) and (min-width: 768px) {
  .mapping-panels {
    display: block;
    overflow-x: auto;
  }
  
  .csv-column-list,
  .database-field-list {
    display: inline-block;
    width: 300px;
    vertical-align: top;
    margin-right: var(--spacing-4);
  }
}

/* Mobile layout */
@media (max-width: 767px) {
  .field-mapping-interface {
    grid-template-rows: auto auto 1fr;
  }
  
  .mapping-panels {
    display: none; /* Hidden by default */
  }
  
  .panel-selector {
    display: flex;
    justify-content: center;
    gap: var(--spacing-2);
  }
  
  .active-panel {
    display: block;
  }
}
```

### Panel Styling
```css
.mapping-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--panel-radius);
  padding: var(--panel-padding);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--border-secondary);
}

.panel-title {
  font: var(--heading-secondary);
  color: var(--text-primary);
}

.panel-content {
  flex: 1;
  overflow: auto;
}
```

### Draggable Column Styling
```css
.draggable-column {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--item-padding);
  margin-bottom: var(--item-margin);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--item-radius);
  cursor: grab;
  transition: var(--hover-transition);
  position: relative;
}

.draggable-column:hover {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.draggable-column[data-dragging="true"] {
  opacity: 0.5;
  cursor: grabbing;
  transform: rotate(2deg);
  box-shadow: var(--shadow-drag);
}

.drag-handle {
  width: var(--drag-handle-size);
  height: var(--drag-handle-size);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.column-info {
  flex: 1;
  min-width: 0;
}

.column-name {
  font: var(--label-text);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
  truncate: true;
}

.column-preview {
  font: var(--caption-text);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mapping-status-badge {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--badge-radius);
  font: var(--caption-text);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-mapped {
  background: color-mix(in srgb, var(--status-mapped) 10%, transparent);
  color: var(--status-mapped);
  border: 1px solid var(--status-mapped);
}

.badge-unmapped {
  background: color-mix(in srgb, var(--status-unmapped) 10%, transparent);
  color: var(--status-unmapped);
  border: 1px solid var(--status-unmapped);
}

.badge-warning {
  background: color-mix(in srgb, var(--status-warning) 10%, transparent);
  color: var(--status-warning);
  border: 1px solid var(--status-warning);
}
```

### Drop Zone Styling
```css
.drop-zone-field {
  padding: var(--item-padding);
  margin-bottom: var(--item-margin);
  background: var(--bg-primary);
  border: 2px dashed var(--border-primary);
  border-radius: var(--item-radius);
  transition: var(--state-transition);
  min-height: var(--field-item-height);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.drop-zone-field[data-drop-target="true"] {
  border-color: var(--drop-valid);
  background: color-mix(in srgb, var(--drop-valid) 5%, transparent);
  transform: scale(1.02);
}

.drop-zone-field[data-drop-invalid="true"] {
  border-color: var(--drop-invalid);
  background: color-mix(in srgb, var(--drop-invalid) 5%, transparent);
}

.drop-zone-field--required {
  border-left: 4px solid var(--status-error);
}

.drop-zone-field--required[data-mapped="true"] {
  border-left-color: var(--status-mapped);
}

.field-icon {
  width: 24px;
  height: 24px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.field-info {
  flex: 1;
  min-width: 0;
}

.field-name {
  font: var(--label-text);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.field-name--required::after {
  content: " *";
  color: var(--status-error);
}

.field-description {
  font: var(--caption-text);
  color: var(--text-secondary);
}

.current-mapping {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background: var(--bg-accent);
  border-radius: var(--radius-base);
  margin-top: var(--spacing-2);
}

.mapping-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.mapping-indicator--high {
  background: var(--confidence-high);
}

.mapping-indicator--medium {
  background: var(--confidence-medium);
}

.mapping-indicator--low {
  background: var(--confidence-low);
}

.clear-mapping {
  padding: var(--spacing-1);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-base);
  transition: var(--hover-transition);
}

.clear-mapping:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
```

### Preview Table Styling
```css
.mapping-preview {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--panel-radius);
  overflow: hidden;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font: var(--body-text);
}

.preview-header {
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-primary);
}

.preview-header th {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  font: var(--label-text);
  color: var(--text-primary);
  border-right: 1px solid var(--border-secondary);
}

.preview-header th:last-child {
  border-right: none;
}

.preview-row {
  border-bottom: 1px solid var(--border-secondary);
}

.preview-row:hover {
  background: var(--bg-accent);
}

.preview-cell {
  padding: var(--spacing-3) var(--spacing-4);
  border-right: 1px solid var(--border-secondary);
  vertical-align: top;
}

.preview-cell:last-child {
  border-right: none;
}

.preview-cell--empty {
  color: var(--text-muted);
  font-style: italic;
}

.preview-cell--error {
  background: color-mix(in srgb, var(--status-error) 10%, transparent);
  color: var(--status-error);
}

.preview-cell--warning {
  background: color-mix(in srgb, var(--status-warning) 10%, transparent);
  color: var(--status-warning);
}

.validation-icon {
  margin-right: var(--spacing-1);
}
```

### Summary Bar Styling
```css
.mapping-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--panel-radius);
  box-shadow: var(--shadow-sm);
}

.summary-stats {
  display: flex;
  gap: var(--spacing-6);
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font: var(--label-text);
}

.stat-icon {
  width: 20px;
  height: 20px;
}

.stat-count {
  font-weight: var(--font-semibold);
}

.summary-actions {
  display: flex;
  gap: var(--spacing-3);
}

.action-button {
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-radius);
  font: var(--label-text);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--hover-transition);
  border: 1px solid transparent;
  height: var(--button-height);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.button-primary {
  background: var(--status-processing);
  color: var(--text-inverse);
  border-color: var(--status-processing);
}

.button-primary:hover {
  background: color-mix(in srgb, var(--status-processing) 90%, black);
}

.button-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.button-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-focus);
}
```

---

## ACCESSIBILITY STYLING

### Focus Indicators
```css
.focusable:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.draggable-column:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--border-focus) 20%, transparent);
}

.drop-zone-field:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--border-focus) 20%, transparent);
}
```

### Screen Reader Only Content
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### High Contrast Mode Support
```css
@media (prefers-contrast: high) {
  .field-mapping-interface {
    --border-primary: #000000;
    --border-secondary: #666666;
    --text-primary: #000000;
    --text-secondary: #333333;
  }
  
  .draggable-column,
  .drop-zone-field {
    border-width: 2px;
    border-style: solid;
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .draggable-column[data-dragging="true"] {
    transform: none;
  }
}
```

---

## RESPONSIVE UTILITIES

### Mobile-Specific Styles
```css
@media (max-width: 767px) {
  .field-mapping-interface {
    --panel-padding: var(--spacing-4);
    --item-padding: var(--spacing-3);
  }
  
  .draggable-column,
  .drop-zone-field {
    min-height: 60px;
  }
  
  .preview-table {
    font-size: var(--text-sm);
  }
  
  .preview-cell {
    padding: var(--spacing-2);
  }
  
  .summary-stats {
    flex-direction: column;
    gap: var(--spacing-2);
    align-items: flex-start;
  }
  
  .summary-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-button {
    justify-content: center;
    width: 100%;
  }
}
```

### Touch-Friendly Sizing
```css
@media (pointer: coarse) {
  .draggable-column,
  .drop-zone-field {
    min-height: 64px; /* Larger touch target */
  }
  
  .clear-mapping,
  .action-button {
    min-height: 44px;
    min-width: 44px;
  }
  
  .drag-handle {
    width: 32px;
    height: 32px;
  }
}
```

---

## DARK MODE SUPPORT

```css
@media (prefers-color-scheme: dark) {
  .field-mapping-interface {
    --bg-primary: #1F2937;
    --bg-secondary: #111827;
    --bg-tertiary: #374151;
    --bg-accent: #1E3A8A;
    
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
    --text-muted: #9CA3AF;
    
    --border-primary: #374151;
    --border-secondary: #4B5563;
  }
}
```

---

## DESIGN SYSTEM SUMMARY

**Color Tokens**: 25+ semantic color variables  
**Typography**: 7 font sizes, 4 weights, 2 font families  
**Spacing**: 12-step spacing scale based on 8px grid  
**Components**: Fully styled for all 8 component variations  
**Responsive**: 3 breakpoints with mobile-first approach  
**Accessibility**: Focus indicators, high contrast, reduced motion  
**Performance**: CSS custom properties for runtime theming  
**Maintainability**: Token-based system for easy updates

**Tailwind Compatibility**: All variables can be imported into Tailwind config  
**CSS-in-JS Ready**: Tokens work with styled-components, emotion, etc.  
**Design Tools**: Figma/Sketch compatible color and spacing values

**Next Phase**: Final Git Commit & Project Summary