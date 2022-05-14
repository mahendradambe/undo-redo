import { beforeEach, describe, expect, it, vi } from "vitest";
import { History } from "./index";
import { HistoryType } from "./types";

describe("history", () => {
    const rollback = vi.fn();
    const execute = vi.fn();
    const rollback2 = vi.fn();
    const execute2 = vi.fn();
    const itemToAdd = {
        execute,
        rollback,
    };
    const itemToAdd2 = {
        execute: execute2,
        rollback: rollback2,
    };
    beforeEach(() => {
        execute.mockReset();
        rollback.mockReset();
        execute2.mockReset();
        rollback2.mockReset();
    });

    describe("History", () => {
        let history: HistoryType;
        beforeEach(() => {
            history = new History();
        });

        it("should be defined", () => {
            expect(history).toBeInstanceOf(History);
        });

        describe("history.add", () => {
            it("should add an item to undo stack and return it", () => {
                expect(history.undoStack.length).toBe(0);
                const item = history.add(itemToAdd);

                expect(item.execute).toBeDefined();
                expect(history.undoStack.length).toBe(1);
            });
        });

        describe("history.undo", () => {
            it("should call the rollback", () => {
                history.add(itemToAdd);

                history.undo();

                expect(rollback).toBeCalled();
            });

            it("should call rollback for specified item", () => {
                const item2 = history.add(itemToAdd2);
                history.add(itemToAdd);

                history.undo(item2);

                expect(rollback2).toBeCalled();
                expect(rollback).not.toBeCalled();
            });

            it("should noop if item to rollback isn't found", () => {
                history.undo({ execute: execute, rollback });
                history.undo();

                expect(rollback).not.toBeCalled();
            });

            it("should remove the item from undo stack and add to redo stack", () => {
                history.add(itemToAdd);
                expect(history.undoStack.length).toBe(1);

                history.undo();
                expect(history.undoStack.length).toBe(0);
                expect(history.redoStack.length).toBe(1);
            });
        });

        describe("history.redo", () => {
            it("should call the execute method", () => {
                history.add(itemToAdd);
                history.undo();

                history.redo();

                expect(execute).toBeCalled();
            });

            it("should call roll for specified item", () => {
                history.add(itemToAdd);
                const item2 = history.add(itemToAdd2);
                history.undo();
                history.undo();

                history.redo(item2);

                expect(execute2).toBeCalled();
            });

            it("should noop if item to rollback isn't found", () => {
                history.redo({ execute: execute, rollback });
                history.redo();

                expect(execute).not.toBeCalled();
            });

            it("should remove the item from undo stack and add to undo stack", () => {
                history.add(itemToAdd);
                expect(history.undoStack.length).toBe(1);

                history.undo();
                expect(history.undoStack.length).toBe(0);

                history.redo();
                expect(history.redoStack.length).toBe(0);
                expect(history.undoStack.length).toBe(1);
            });
        });

        describe("history.remove", () => {
            it("should remove an existing item from undo stack", () => {
                const item = history.add(itemToAdd);
                expect(history.undoStack.length).toBe(1);

                history.remove(item);
                expect(history.undoStack.length).toBe(0);
            });

            it("should remove an existing item from redo stack", () => {
                const item = history.add(itemToAdd);
                history.undo();
                expect(history.redoStack.length).toBe(1);

                history.remove(item);
                expect(history.redoStack.length).toBe(0);
            });
        });
    });
});
