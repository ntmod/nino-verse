// Coordinates are relative to the modal, so the flight follows its responsive layout.
export function getCoinFlightKeyframes(origin, destination, container) {
  const startX = origin.left + origin.width / 2 - container.left;
  const startY = origin.top + origin.height / 2 - container.top;
  const endX = destination.left + destination.width / 2 - container.left;
  const endY = destination.top + destination.height / 2 - container.top;
  const controlX = Math.min(container.width - 24, Math.max(startX, endX) + 64);
  const controlY = startY - 32;
  const times = Array.from({ length: 21 }, (_, i) => i / 20);
  return {
    x: times.map(t => (1 - t) ** 2 * startX + 2 * (1 - t) * t * controlX + t ** 2 * endX),
    y: times.map(t => (1 - t) ** 2 * startY + 2 * (1 - t) * t * controlY + t ** 2 * endY),
    times,
  };
}
