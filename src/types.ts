export interface CommandType {
    execute: <Args extends any[]>(...args: Args) => void | (() => void);
    rollback: () => void;
}

export type DispatchCommand<Args extends any[]> = (
    ...args: Args
) => CommandType;

export type CommandFactory = <Args extends any[]>(
    execute: CommandType["execute"]
) => DispatchCommand<Args>;

export interface HistoryType {
    undoStack: CommandType[];
    redoStack: CommandType[];
    add: (item: CommandType) => CommandType;
    remove: (item: CommandType) => void;
    undo: (item?: CommandType) => void;
    redo: (item?: CommandType) => void;
}
