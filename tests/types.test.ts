import { describe, it, expect } from "vitest";
import {
  DEFAULT_PROJECT,
  DEFAULT_SHAKE,
  DEFAULT_REPEAT,
} from "@/lib/animation/types";

describe("Shake & Repeat defaults", () => {
  it("DEFAULT_SHAKE is all-zero amplitudes (off) with a sane frequency", () => {
    expect(DEFAULT_SHAKE.amplitudeX).toBe(0);
    expect(DEFAULT_SHAKE.amplitudeY).toBe(0);
    expect(DEFAULT_SHAKE.amplitudeRotate).toBe(0);
    expect(DEFAULT_SHAKE.frequency).toBeGreaterThan(0);
    expect(DEFAULT_SHAKE.decay).toBe(0);
  });

  it("DEFAULT_REPEAT is disabled, loop, infinite", () => {
    expect(DEFAULT_REPEAT).toEqual({ enabled: false, mode: "loop", times: "infinite" });
  });

  it("the default project animation carries a disabled repeat and no shake", () => {
    const anim = DEFAULT_PROJECT.animations[0];
    expect(anim.repeat).toEqual({ enabled: false, mode: "loop", times: "infinite" });
    expect(anim.shake).toBeUndefined();
  });
});
