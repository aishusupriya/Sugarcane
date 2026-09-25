---
description: "Build or extend the AgriScan sugarcane disease detection web app from the product brief"
name: "Build AgriScan"
argument-hint: "Describe the AgriScan feature or implementation change"
agent: "agent"
---
Build or extend a responsive web app named **AgriScan** for AI-assisted early sugarcane disease detection from RGB and optional thermal leaf images.

## Product goal
Create a farmer-friendly agri-tech experience that makes capture, analysis, diagnosis, treatment, history, and agronomist insights easy to scan and use on mobile and desktop. Keep copy concise and rely on clear icons, labels, color, and progressive disclosure.

## Required stack
- Frontend: React with Tailwind CSS.
- Charts: Recharts.
- Backend: FastAPI mock endpoints.
- Use the project's existing framework, package manager, component conventions, and scripts when they exist.
- If the project is empty, establish a minimal maintainable structure for the chosen stack before implementing features.

## Required screens and behavior
1. **Home / Capture**
   - Provide an RGB leaf-image upload control.
   - Provide an optional thermal-image toggle and thermal upload control.
   - Show recent scans in a responsive carousel or horizontally scrollable strip.
2. **Analyzing**
   - Show the uploaded leaf image with an animated scan line and pulse/loading treatment.
   - Simulate analysis for 2 to 3 seconds, with an accessible status message.
3. **Result**
   - Show disease name, severity badge, image preview, and confidence.
   - Use severity colors consistently: green for healthy, amber for moderate, red for severe.
   - Animate a confidence ring from 0 to the returned score, such as 96.7%.
   - When thermal data is available, allow the user to show or hide a thermal heatmap overlay on the leaf image.
4. **Treatment card**
   - Provide an expandable checklist with icons and completion state for:
     - Remove affected leaves.
     - Apply fungicide.
     - Maintain drainage.
   - Use a restrained slide-in or expand animation.
5. **History**
   - Show a scrollable timeline of past scans with thumbnail, disease tag, and date.
   - Include a field-health trend line chart using Recharts.
6. **Insights / admin or agronomist view**
   - Show a confusion matrix.
   - Show accuracy, precision, recall, and F1 metric cards.
   - Show aggregate statistics across multiple fields.

## Mock data and API boundary
Use mock/sample predictions because no real model is connected. Disease classes must include: Healthy, Red Rot, Rust, Mosaic, Smut, Yellow Leaf, and Wilt.

Create a clear API boundary so a real `/predict` request can replace the mock implementation later. Keep request and response shapes explicit, for example:
- Request: RGB image plus optional thermal image and field metadata.
- Response: disease class, severity, confidence, thermal availability, treatment steps, and timestamp.

Use deterministic or seeded sample data where that improves repeatable demos and tests. Handle loading, empty, invalid-file, and error states rather than only the happy path.

## Visual and interaction direction
- Use an agri-tech green and deep teal palette with supporting neutrals and strong contrast.
- Make the layout mobile-first, responsive, spacious, and easy to operate with touch.
- Use clean modern cards only where content is genuinely grouped; avoid nesting cards inside cards.
- Add subtle page-load, scan, ring-counting, and expand/collapse motion without making the interface busy.
- Use expressive, readable typography consistent with the existing project; do not default to an interchangeable dashboard style.
- Use familiar icons for upload, thermal mode, severity, treatment, history, fields, and analytics. Add accessible labels and tooltips where an icon is unfamiliar.
- Keep controls keyboard accessible, provide visible focus states, and ensure text and status changes are screen-reader friendly.
- Prevent overlap and layout shift at narrow and wide viewport sizes.

## Implementation guidance
- First inspect the existing repository structure and conventions, then make the smallest coherent set of changes.
- Preserve existing functionality and avoid unrelated refactors.
- Separate UI, domain/sample data, API client, and mock FastAPI logic so a real model service can be introduced without rewriting the screens.
- Prefer reusable components for upload, scan status, disease result, confidence ring, treatment checklist, timeline item, metric card, and chart panels.
- Keep disease/severity presentation data-driven rather than duplicating conditionals across screens.
- Add focused tests for prediction mapping, severity styling, analysis transition, confidence rendering, and key upload/error states when the project has a test setup.

## Validation
After implementation:
1. Run the project's formatter, typecheck, lint, and focused tests when available.
2. Start the development server and verify the primary capture-to-result flow.
3. Check mobile and desktop layouts, including RGB-only and RGB-plus-thermal paths.
4. Confirm the analysis delay, confidence animation, thermal toggle, treatment expansion, history chart, and insights metrics work with mock data.
5. Report changed files, commands run, and any remaining limitation, especially that predictions are mocked.

For the requested change, state assumptions briefly, implement the feature end to end, and finish with a concise verification summary.
