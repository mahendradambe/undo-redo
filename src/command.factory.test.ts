import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCommandFactory } from "./command.factory";
import { History } from "./history";
import { CommandFactory, CommandType, DispatchCommand } from "./types";

describe("command.factory", () => {
    let history: History;
    let execute: CommandType["execute"];
    let rollback: CommandType["rollback"];

    beforeEach(() => {
        history = new History();
        rollback = vi.fn();
        execute = vi.fn(() => rollback);
    });

    describe("createCommandFactory", () => {
        it("should return a command factory when history is provided", () => {
            const commandFactory = createCommandFactory(history);

            expect(commandFactory).toBeDefined();
        });

        describe("commandFactory", () => {
            let commandFactory: CommandFactory;

            beforeEach(() => {
                commandFactory = createCommandFactory(history);
            });

            it("should create a command dispatcher when execute is provided", () => {
                const dispatch = commandFactory(execute);

                expect(dispatch).toBeDefined();
            });

            describe("when dispatch is called", () => {
                let dispatch: DispatchCommand<[void | boolean]>;

                beforeEach(() => {
                    dispatch = commandFactory(execute);
                });

                it("should invoke the execute", () => {
                    dispatch();

                    expect(execute).toBeCalledTimes(1);
                });

                it("should invoke the execute with provided args", () => {
                    dispatch(true);

                    expect(execute).toBeCalledTimes(1);
                    expect(execute).toBeCalledWith(true);
                });

                it("should push the command to the history's undo stack", () => {
                    dispatch(true);

                    expect(history.undoStack.length).toBe(1);
                });

                it("the history's command should be undoable and redoable", () => {
                    dispatch(true);
                    expect(history.undoStack.length).toBe(1);

                    history.undo();
                    expect(history.undoStack.length).toBe(0);
                    expect(rollback).toBeCalledTimes(1);
                    expect(history.redoStack.length).toBe(1);

                    history.redo();
                    expect(history.redoStack.length).toBe(0);
                    expect(execute).toBeCalledTimes(2);
                    expect(history.undoStack.length).toBe(1);
                });
            });

            describe("when the execute doesn't return a rollback fn", () => {
                let execute: CommandType["execute"];
                let dispatch: DispatchCommand<void[]>;

                beforeEach(() => {
                    execute = vi.fn();
                    dispatch = commandFactory(execute);
                });

                it("should still return a command", () => {
                    dispatch();

                    expect(execute).toBeCalled();
                });

                it("shouldn't affect the history", () => {
                    const command = dispatch();

                    expect(history.undoStack.indexOf(command)).toBe(-1);
                    expect(history.redoStack.indexOf(command)).toBe(-1);
                });
            });
        });
    });
});
