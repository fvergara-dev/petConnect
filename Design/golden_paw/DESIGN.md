# Design System Strategy: The Tactile Oasis

## 1. Overview & Creative North Star
The "Tactile Oasis" is the driving philosophy behind this design system. We are moving away from the rigid, boxed-in layouts of traditional social networks to create a digital environment that feels as welcoming and organic as a sun-drenched park. 

Our **Creative North Star** is "Playful Sophistication." We achieve this by blending the "joy" of pet ownership with a high-end, editorial layout. Instead of a standard grid, we utilize **intentional asymmetry**—letting images of pets break out of their containers and using dramatic typography scales to guide the eye. We don't just "display" content; we curate a community experience through soft layering and expansive breathing room.

---

## 2. Color & Tonal Depth
The palette is a sophisticated mix of warm ambers and calm blues, designed to evoke trust and energy.

### The "No-Line" Rule
**Traditional 1px borders are strictly prohibited.** To section content, designers must use background shifts. For example, a `surface-container-low` (#fff1e4) section should sit directly on a `surface` (#fff8f4) background. This creates a "soft-edge" layout that feels modern and bespoke.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of fine, heavy-weight paper.
*   **Base:** `surface` (#fff8f4)
*   **Secondary Sections:** `surface-container-low` (#fff1e4)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Floating Elements:** `surface-bright` with Glassmorphism applied.

### The Glass & Gradient Rule
To add "soul" to the interface, use subtle, organic gradients for primary actions. A transition from `primary` (#8c5100) to `primary-container` (#ffb05e) adds a sun-kissed depth that flat colors lack. For floating navigation or overlays, apply `backdrop-blur: 20px` with a semi-transparent `surface-container` color to create a frosted-glass effect that lets pet photos bleed through softly.

---

## 3. Typography
We use **Plus Jakarta Sans** across the board. Its rounded terminals mirror the "soft corner" aesthetic of the UI while maintaining professional legibility.

*   **Display (Display-LG 3.5rem):** Reserved for high-impact community headlines. Use with tight letter-spacing (-0.02em) to create an authoritative, editorial feel.
*   **Headlines (Headline-MD 1.75rem):** The primary voice for user stories. Use `on-surface` (#482d00) to maintain warmth.
*   **Body (Body-LG 1rem):** Optimized for readability in social feeds. 
*   **Labels (Label-MD 0.75rem):** Used for pet metadata (e.g., breed, age). These should be styled with `on-surface-variant` (#7b5925) for a secondary hierarchy.

---

## 4. Elevation & Depth
We eschew the "drop shadow" defaults for a more natural, ambient light model.

*   **The Layering Principle:** Depth is primarily achieved through **Tonal Layering**. Place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in brightness creates an "edge" that the eye perceives as elevation without the need for ink.
*   **Ambient Shadows:** If a card must "float" (e.g., a pet profile modal), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(72, 45, 0, 0.06)`. Note the use of `on-surface` (#482d00) as the shadow tint rather than pure black; this ensures the shadow feels like a natural part of the warm environment.
*   **The Ghost Border:** If a boundary is required for accessibility, use `outline-variant` (#d6aa6f) at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons
*   **Primary:** High-radius (`xl`: 3rem). Background: `primary` (#8c5100). These should feel like smooth river stones.
*   **Secondary:** Glassmorphic. Background: `secondary-container` (#cae6ff) at 80% opacity with blur.
*   **States:** On hover, shift to `primary-fixed-dim` (#ff9c1f). Avoid "shrinking" animations; use subtle elevation lifts instead.

### Cards & Lists
*   **Rule:** **No divider lines.**
*   **Implementation:** Separate list items using `1.5rem` (md) vertical spacing or by nesting cards of `surface-container-highest` inside a `surface-container` area. 
*   **Pet Profile Cards:** Use the `lg` (2rem) border radius. Use `tertiary-container` (#fdd400) for "Featured Pet" badges to inject energy.

### Input Fields
*   **Styling:** Use `surface-container-highest` (#ffddb3) as the fill. 
*   **Focus State:** The border should transition to a 2px `secondary` (#006594) "Ghost Border" at 40% opacity. 

### Signature Component: The "Pet-Bubble" Avatar
Avatars should not be simple circles. Use a "squircle" shape (using the `xl` 3rem radius) with a 4px `on-primary-container` (#5b3300) offset ring to make user profiles feel distinctive.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If a section feels crowded, increase the gap before adding a border.
*   **DO** overlap elements. A pet photo should slightly break the boundary of its container to create a 3D, tactile effect.
*   **DO** use `tertiary` (#715e00) accents for "joyful" moments like likes, rewards, or community milestones.

### Don't
*   **DON'T** use pure black (#000000) for text. Always use `on-surface` (#482d00) to keep the tone warm and inviting.
*   **DON'T** use sharp corners. Every element, from checkboxes to hero images, must utilize the roundedness scale (minimum `sm`: 0.5rem).
*   **DON'T** use "Default" Material shadows. If it looks like a standard Android app, it has failed the "Editorial" test. Keep shadows wide, light, and tinted.