export function layoutMasonry(heights, columns, gap = 24) {
  const bottoms = Array(columns).fill(0);
  const positions = heights.map(height => {
    const column = bottoms.indexOf(Math.min(...bottoms));
    const top = bottoms[column];
    bottoms[column] += height + gap;
    return { column, top };
  });
  return { positions, height: Math.max(0, ...bottoms) - (heights.length ? gap : 0) };
}
