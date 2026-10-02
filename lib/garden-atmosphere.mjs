// Follow the viewer's local clock, including when revisiting an old cycle.
export function getGardenAtmosphere(hour) {
  if (hour >= 6 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'evening';
  return 'night';
}
