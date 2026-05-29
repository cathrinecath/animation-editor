/**
 * Evaluate a CSS-style cubic bezier curve from (0,0) to (1,1) with two
 * intermediate control points.
 *
 * Given input progress `t` in [0, 1], find the curve parameter `u` such that
 * X(u) = t, then return Y(u).
 *
 * Uses Newton-Raphson with a bisection fallback for stability near the ends.
 */
export function evalCubicBezier(
  control: [number, number, number, number],
  t: number,
): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  const [x1, y1, x2, y2] = control;

  // X and Y are cubic Bezier polynomials in u: B(u) = 3(1-u)^2*u*p1 + 3(1-u)*u^2*p2 + u^3
  const sampleX = (u: number) =>
    3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const sampleY = (u: number) =>
    3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  const sampleDerivX = (u: number) => {
    const a = 1 - u;
    return 3 * a * a * x1 + 6 * a * u * (x2 - x1) + 3 * u * u * (1 - x2);
  };

  // Newton-Raphson for initial guess
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleX(u) - t;
    if (Math.abs(x) < 1e-6) return sampleY(u);
    const dx = sampleDerivX(u);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
  }

  // Bisection fallback
  let lo = 0;
  let hi = 1;
  u = t;
  for (let i = 0; i < 32; i++) {
    const x = sampleX(u);
    if (Math.abs(x - t) < 1e-7) return sampleY(u);
    if (x < t) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }

  return sampleY(u);
}
