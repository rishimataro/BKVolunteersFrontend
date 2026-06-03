---
name: Unity Academic Digital Platform
colors:
    surface: '#f8f9fa'
    surface-dim: '#d9dadb'
    surface-bright: '#f8f9fa'
    surface-container-lowest: '#ffffff'
    surface-container-low: '#f3f4f5'
    surface-container: '#edeeef'
    surface-container-high: '#e7e8e9'
    surface-container-highest: '#e1e3e4'
    on-surface: '#191c1d'
    on-surface-variant: '#424750'
    inverse-surface: '#2e3132'
    inverse-on-surface: '#f0f1f2'
    outline: '#737781'
    outline-variant: '#c3c6d2'
    surface-tint: '#305ea0'
    primary: '#002a58'
    on-primary: '#ffffff'
    primary-container: '#004080'
    on-primary-container: '#83aef5'
    inverse-primary: '#a9c7ff'
    secondary: '#006d37'
    on-secondary: '#ffffff'
    secondary-container: '#6bfe9c'
    on-secondary-container: '#00743a'
    tertiary: '#4c1d00'
    on-tertiary: '#ffffff'
    tertiary-container: '#6f2d00'
    on-tertiary-container: '#f59561'
    error: '#ba1a1a'
    on-error: '#ffffff'
    error-container: '#ffdad6'
    on-error-container: '#93000a'
    primary-fixed: '#d6e3ff'
    primary-fixed-dim: '#a9c7ff'
    on-primary-fixed: '#001b3d'
    on-primary-fixed-variant: '#0e4686'
    secondary-fixed: '#6bfe9c'
    secondary-fixed-dim: '#4ae183'
    on-secondary-fixed: '#00210c'
    on-secondary-fixed-variant: '#005228'
    tertiary-fixed: '#ffdbcb'
    tertiary-fixed-dim: '#ffb691'
    on-tertiary-fixed: '#341100'
    on-tertiary-fixed-variant: '#773305'
    background: '#f8f9fa'
    on-background: '#191c1d'
    surface-variant: '#e1e3e4'
typography:
    h1:
        fontFamily: Public Sans
        fontSize: 40px
        fontWeight: '700'
        lineHeight: 48px
    h2:
        fontFamily: Public Sans
        fontSize: 32px
        fontWeight: '600'
        lineHeight: 40px
    h3:
        fontFamily: Public Sans
        fontSize: 24px
        fontWeight: '600'
        lineHeight: 32px
    body-lg:
        fontFamily: Public Sans
        fontSize: 18px
        fontWeight: '400'
        lineHeight: 28px
    body-md:
        fontFamily: Public Sans
        fontSize: 16px
        fontWeight: '400'
        lineHeight: 24px
    body-sm:
        fontFamily: Public Sans
        fontSize: 14px
        fontWeight: '400'
        lineHeight: 20px
    label-bold:
        fontFamily: Public Sans
        fontSize: 12px
        fontWeight: '700'
        lineHeight: 16px
        letterSpacing: 0.05em
    button:
        fontFamily: Public Sans
        fontSize: 15px
        fontWeight: '600'
        lineHeight: 20px
rounded:
    sm: 0.25rem
    DEFAULT: 0.5rem
    md: 0.75rem
    lg: 1rem
    xl: 1.5rem
    full: 9999px
spacing:
    base: 8px
    container-max: 1280px
    gutter: 24px
    margin-mobile: 16px
    stack-sm: 12px
    stack-md: 24px
    stack-lg: 48px
---

## Brand & Style

The brand personality is **Academic Modernism**. It balances the prestigious, established authority of a higher education institution with the energetic, forward-thinking spirit of student-led volunteerism. The UI must evoke a sense of structural integrity, transparency, and organized impact.

The design style follows a **Corporate / Modern** aesthetic. It utilizes generous whitespace, high-quality typography, and a structured grid to ensure clarity in complex data management (fundraising and campaign tracking). The interface avoids decorative fluff in favor of functional elegance, ensuring that users—ranging from university administrators to student leaders—feel they are using a robust, official tool.

## Colors

This design system uses a palette rooted in institutional trust.

- **Primary (Academic Blue):** Used for navigation headers, primary buttons, and structural elements to signify authority.
- **Secondary (Emerald Green):** Reserved for "action" items related to growth, such as "Đóng góp," "Tham gia," and progress indicators.
- **Neutral Surface:** A clean, light-gray base (#F8F9FA) reduces eye strain and distinguishes the background from white content cards.
- **Semantic Colors:** Clear Red/Orange accents are used strictly for system alerts, deadline warnings, and critical status updates.

## Typography

**Public Sans** is selected for its institutional clarity and high readability across both administrative tables and public-facing campaign pages.

- **Hierarchy:** Use H1 and H2 exclusively for page titles and major section headers.
- **Weight:** Use Bold (700) for primary emphasis and Regular (400) for long-form descriptions or table data.
- **Labels:** Small, uppercase labels with slight letter spacing should be used for metadata and table headers to create a distinct visual layer from body content.

## Layout & Spacing

The system utilizes a **12-column fixed grid** for desktop, centered within a maximum container width of 1280px. This ensures readability on ultra-wide monitors while maintaining a professional "document" feel.

- **Rhythm:** An 8px base unit drives all spacing decisions.
- **Density:** Administrative views (tables/dashboards) should use tighter spacing (stack-sm) to maximize information density.
- **Margins:** Consistent 24px gutters between grid columns ensure visual breathing room between card-based components.

## Elevation & Depth

Depth is conveyed through **Ambient Shadows** and tonal layering.

- **Surface Level 0:** Background (#F8F9FA).
- **Surface Level 1:** White cards with a subtle, diffused shadow (0px 4px 12px rgba(0, 0, 0, 0.05)).
- **Surface Level 2 (Hover/Active):** Increased shadow spread (0px 8px 24px rgba(0, 0, 0, 0.08)) to indicate interactivity.
- **Borders:** A 1px stroke (#E2E8F0) is used on all containers to define boundaries clearly, even in low-contrast environments.

## Shapes

The shape language is **Rounded**, striking a balance between modern friendliness and academic rigor.

- **Standard Radius:** 8px for small components like input fields and buttons.
- **Large Radius:** 12px for main content cards and modals.
- **Pill Shape:** Reserved strictly for status badges and tags to differentiate them from actionable buttons.

## Components

- **Buttons:** Primary buttons use Academic Blue with white text. Secondary buttons use a subtle gray outline. Success actions (e.g., "Quyên góp") use Emerald Green.
- **Status Badges:**
    - _Nháp:_ Gray background, dark gray text.
    - _Chờ sơ duyệt:_ Orange background, white text.
    - _Đã duyệt / Đang diễn ra:_ Emerald Green background, white text.
    - _Đã kết thúc:_ Academic Blue background, white text.
- **Progress Bars:** Use a dual-tone Emerald Green (Light green track, Dark green fill). Display the percentage and the "Số tiền hiện tại / Mục tiêu" clearly above the bar.
- **Cards:** White background, 12px radius, 1px light border. Used for campaign summaries, news items, and volunteer profiles.
- **Tables:** Use a "Sticky Header" design. Rows should have a subtle hover state (#F1F5F9). Filters should be placed in a horizontal bar immediately above the table header.
- **Icons:** Use **24px Outline Icons** with a consistent 1.5px stroke weight. Icons should be monochrome (Academic Blue) unless indicating an error or success state.
- **Input Fields:** 8px radius, 1px border. Focus state uses a 2px Academic Blue ring with 20% opacity.
