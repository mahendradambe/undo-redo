import { describe, expect, it } from "vitest";
import { noop } from "./utils";

describe("noop", () => {
    it("should be invokable and should return undefined", () => {
        expect(noop()).toBeUndefined();
    });
});
