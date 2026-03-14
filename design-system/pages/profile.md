# Page Override: Profile

> Overrides `design-system/MASTER.md` for the ProfilePage.

## Layout

- **Structure:** Sectioned form with clear visual groups
- **Sections:** Personal Data > Nutrition Goals > Feature Toggles > Integrations
- Each section in a card with heading
- Mobile: single column
- Desktop: max-width `2xl`, centered

## Form Fields

- Labels above inputs (not floating)
- Input fields use standard `Input` component
- Number fields for nutrition goals with unit labels (kcal, g)
- Inline validation with error messages below fields

## Feature Toggles

- Use Toggle/Switch components
- Label left, toggle right
- Description text below label in muted color

## Style

- Clean, minimal form design
- Inter font for all form elements
- Generous spacing between sections (`space-y-8`)
