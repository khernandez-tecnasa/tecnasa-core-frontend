// Douglas-Peucker polyline simplification.
// points: Array<[lat, lng]>
// epsilon: tolerance in degrees (0.002 ≈ 220 m — good for 6 km detection radius)
// Returns simplified Array<[lat, lng]>

const perpDist = ([px, py], [x1, y1], [x2, y2]) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

export function douglasPeucker(points, epsilon = 0.002) {
  if (points.length < 3) return points;

  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }

  if (maxDist > epsilon) {
    const left  = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

// Converts simplified [lat, lng] array to backend payload format
export function toGeometriaPayload(simplified) {
  return simplified.map(([lat, lng]) => ({ lat, lng }));
}
