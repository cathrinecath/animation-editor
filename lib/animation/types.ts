export type Project = {
  schemaVersion: 0;
  container: { width: number; height: number };
  elements: Element[];
  animations: Animation[];
};

export type Element = {
  id: string;
  type: ElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Record<string, string>;
};

export type ElementType = "circle";

export type Animation = {
  id: string;
  elementId: string;
  motionUnit: MotionUnit;
  input: AnimationInput;
  tracks: PropertyTrack[];
  shake?: Shake;     // omitted ⇒ no shake
  repeat: Repeat;    // always present; enabled:false ⇒ plays once
};

export type AnimationInput =
  | { type: "mount"; delay: number; duration: number };

export type PropertyTrack = {
  property: Property;
  waypoints: Waypoint[];
  easing: Easing;
};

export type Property = "translateX" | "translateY";

export type Waypoint = {
  progress: number;
  value: number;
};

export type Easing =
  | { type: "cubic-bezier"; control: [number, number, number, number] };

export type Shake = {
  amplitudeX: number;       // px, left/right
  amplitudeY: number;       // px, up/down
  amplitudeRotate: number;  // deg, wobble
  frequency: number;        // oscillations across one play of the duration (>= 0)
  decay: number;            // 0 = constant amplitude … 1 = fully settled by the end
};

export type Repeat = {
  enabled: boolean;             // the On/Off toggle
  mode: "loop" | "bounce";      // remembered even while enabled:false
  times: number | "infinite";   // "infinite" = forever
};

export const DEFAULT_SHAKE: Shake = {
  amplitudeX: 0,
  amplitudeY: 0,
  amplitudeRotate: 0,
  frequency: 3,
  decay: 0,
};

export const DEFAULT_REPEAT: Repeat = {
  enabled: false,
  mode: "loop",
  times: "infinite",
};

/**
 * How exported motion is measured.
 * - "container": travel scales with the parent (exported as cqw/cqh).
 * - "px": travel is a fixed pixel distance (exported as px).
 * Stored waypoint values are ALWAYS px regardless of this flag; it only changes
 * the unit the exporter emits and how the store scales px on a container resize.
 */
export type MotionUnit = "container" | "px";

export const DEFAULT_PROJECT: Project = {
  schemaVersion: 0,
  container: { width: 400, height: 300 },
  elements: [
    {
      id: "circle-1",
      type: "circle",
      position: { x: 380, y: 230 },
      size: { width: 40, height: 40 },
      style: { background: "#6b7280", borderRadius: "9999px" },
    },
  ],
  animations: [
    {
      id: "anim-1",
      elementId: "circle-1",
      motionUnit: "container",
      input: { type: "mount", delay: 0, duration: 1000 },
      repeat: { enabled: false, mode: "loop", times: "infinite" },
      tracks: [
        {
          property: "translateX",
          waypoints: [
            { progress: 0, value: 0 },
            { progress: 1, value: 0 },
          ],
          easing: { type: "cubic-bezier", control: [0.42, 0, 0.58, 1] },
        },
        {
          property: "translateY",
          waypoints: [
            { progress: 0, value: 0 },
            { progress: 1, value: 0 },
          ],
          easing: { type: "cubic-bezier", control: [0.42, 0, 0.58, 1] },
        },
      ],
    },
  ],
};
