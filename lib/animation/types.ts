export type Project = {
  schemaVersion: 0;
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
  input: AnimationInput;
  tracks: PropertyTrack[];
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

export const DEFAULT_PROJECT: Project = {
  schemaVersion: 0,
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
      input: { type: "mount", delay: 0, duration: 1000 },
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
