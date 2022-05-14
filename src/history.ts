import { CommandType, HistoryType } from "./types";

export class History implements HistoryType {
    readonly undoStack: CommandType[] = [];
    readonly redoStack: CommandType[] = [];

    add(item: CommandType) {
        this.undoStack.push(item);
        return item;
    }

    remove(item: CommandType) {
        const undoIndex = this.undoStack.indexOf(item);
        if (undoIndex !== -1) {
            this.undoStack.splice(undoIndex, 1);
        }

        const redoIndex = this.redoStack.indexOf(item);
        if (redoIndex !== -1) {
            this.redoStack.splice(redoIndex, 1);
        }
    }

    undo(item?: CommandType | undefined) {
        if (item) {
            const index = this.undoStack.indexOf(item);
            if (index === -1) return;

            this.undoStack.splice(index, 1);
            item.rollback();
            this.redoStack.push(item);
            return;
        }

        const lastItem = this.undoStack.pop();
        if (!lastItem) return;

        lastItem.rollback();
        this.redoStack.push(lastItem);
    }

    redo(item?: CommandType | undefined) {
        if (item) {
            const index = this.redoStack.indexOf(item);
            if (index === -1) return;

            this.redoStack.splice(index, 1);
            item.execute();
            this.undoStack.push(item);
        }

        const lastItem = this.redoStack.pop();
        if (!lastItem) return;

        lastItem.execute();
        this.undoStack.push(lastItem);
    }
}
