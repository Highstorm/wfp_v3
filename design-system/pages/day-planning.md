# Page Override: Day Planning

> Overrides `design-system/MASTER.md` for the DayPlanningPage.

## Layout

- **Structure:** WeekCalendar (top) > NutritionSummary > MealSections (cards) > Optional sections
- **Style:** Soft UI with subtle card elevation
- **Mobile:** Single column, cards stack vertically
- **Desktop:** Max-width `4xl`, centered

## Nutrition Summary

- Calories: Circular SVG progress ring (primary color), large number center
- Macros (Protein/Carbs/Fat): Horizontal progress bars with percentage labels
- Use semantic nutrition colors: `--color-calories`, `--color-protein`, `--color-carbs`, `--color-fat`
- Animate bar fills on value change (250ms ease-in-out)
- Show deficit/surplus: green for on-target, destructive for over-target

## Meal Sections

- Tabs or cards for: Breakfast, Lunch, Dinner, Snacks
- Each meal card: name, quantity, calories inline
- Add-dish: Searchable combobox (Headless UI Combobox)
- Quick quantity adjustment: Stepper (- / input / +)

## Week Calendar

- Horizontal scrollable week view
- Active day: primary color highlight
- Days with plans: dot indicator below date

## Optional Sections

- Sport, StomachPain, Notes: Collapsible cards (closed by default)
- Expand with smooth height transition
