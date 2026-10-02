// Durations measured from the transparent WebP frames, in milliseconds.
/** @type {[string, number][]} */
const ANIMATIONS = [
  ['teftel-cat-01', 2160], ['teftel-cat-03', 2400],
  ['teftel-cat-07', 1960], ['teftel-cat-09', 3600],
  ['teftel-cat-11', 3600], ['teftel-cat-12', 3200],
  ['teftel-cat-20', 3200], ['teftel-cat-24', 1600],
];
export const GARDEN_SPOTS = [[50, 45], [57, 61], [43, 78], [52, 91], [61, 67]];

/** @param {{ asset: string, spot: number, sequence: number } | null} previous */
export function nextGardenVisit(previous = null, random = Math.random) {
  const animations = ANIMATIONS.filter(([asset]) => asset !== previous?.asset);
  const spots = GARDEN_SPOTS.map((_, index) => index).filter(index => index !== previous?.spot);
  const [asset, duration] = animations[Math.floor(random() * animations.length)];
  const spot = spots[Math.floor(random() * spots.length)];
  const loops = 2 + Math.floor(random() * 2);
  return { asset, duration, spot, loops, sequence: (previous?.sequence ?? 0) + 1 };
}
