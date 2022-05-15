import { beforeEach, describe, expect, it } from "vitest";
import create, { StateCreator } from "zustand/vanilla";
import { History } from "./history";
import { historyMiddleware } from "./zustand";

describe("zustand", () => {
    const history = new History();

    interface BearState {
        bears: number;
        incr: () => void;
        decr: () => void;
    }

    const stateCreator: StateCreator<
        BearState,
        [["zustand/history", never]],
        [],
        BearState
    > = (set) => {
        return {
            bears: 0,
            incr: () =>
                set((state) => {
                    state.bears++;
                }),
            decr: () =>
                set((state) => {
                    state.bears--;

                    return state;
                }),
        };
    };

    let reset: () => void;

    const createTestState = () => {
        const store = create<BearState>()(
            historyMiddleware(stateCreator, history)
        );
        const initialState = store.getState();
        reset = () => store.setState(initialState, true);

        return store;
    };

    beforeEach(() => {
        reset();
    });

    const store = createTestState();

    describe("zustandMiddleware", () => {
        it("should be defined", () => {
            expect(store).toBeDefined();
        });

        it("should increase the bear population", () => {
            store.getState().incr();

            expect(store.getState().bears).toBe(1);
        });

        it("should be undoable", () => {
            history.undo();

            expect(store.getState().bears).toBe(0);
        });

        it("should be redoable", () => {
            history.redo();

            expect(store.getState().bears).toBe(1);
        });

        it("should be consistent across invocations", () => {
            store.getState().incr();
            expect(store.getState().bears).toBe(1);
            store.getState().incr();
            expect(store.getState().bears).toBe(2);
            store.getState().decr();
            expect(store.getState().bears).toBe(1);

            history.undo();
            expect(store.getState().bears).toBe(2);
            history.undo();
            expect(store.getState().bears).toBe(1);
            history.redo();
            expect(store.getState().bears).toBe(2);
        });
    });
});
