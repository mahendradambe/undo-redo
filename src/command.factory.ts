import { History } from "./history";
import { CommandFactory, CommandType } from "./types";
import { noop } from "./utils";

export const createCommandFactory =
    (history: History): CommandFactory =>
    (execute) =>
    (...args) => {
        const rollback = execute(...args);

        if (typeof rollback !== "function") {
            return {
                execute,
                rollback: noop,
            };
        }

        const command: CommandType = {
            execute,
            rollback,
        };

        history.add(command);

        return command;
    };
