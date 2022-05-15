import { applyPatches, Draft, enablePatches, produceWithPatches } from "immer";
import { State, StateCreator, StoreMutatorIdentifier } from "zustand";
import { createCommandFactory } from "./command.factory";
import { History } from "./history";
import { HistoryType } from "./types";

enablePatches();

type HistoryMiddleware = <
    T extends State,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
    initializer: StateCreator<T, [...Mps, ["zustand/history", never]], Mcs>,
    history: HistoryType
) => StateCreator<T, Mps, [["zustand/history", never], ...Mcs]>;

type SkipTwo<T> = T extends []
    ? []
    : T extends [unknown]
    ? []
    : T extends [unknown?]
    ? []
    : T extends [unknown, unknown, ...infer A]
    ? A
    : T extends [unknown, unknown?, ...infer A]
    ? A
    : T extends [unknown?, unknown?, ...infer A]
    ? A
    : never;

type StoreHistory<S> = S extends {
    getState: () => infer T;
    setState: infer SetState;
}
    ? SetState extends (...a: infer A) => infer SetStateReturns
        ? {
              setState(
                  nextStateOrUpdater:
                      | T
                      | Partial<T>
                      | ((state: Draft<T>) => void),
                  shouldReplace?: boolean | undefined,
                  ...a: SkipTwo<A>
              ): SetStateReturns;
          } & { history: HistoryType }
        : never
    : never;

type WithHistory<S> = Write<Cast<S, object>, StoreHistory<S>>;

declare module "zustand" {
    interface StoreMutators<S, A> {
        ["zustand/history"]: WithHistory<S>;
    }
}

type Write<T extends object, U extends object> = Omit<T, keyof U> & U;

type Cast<T, U> = T extends U ? T : U;

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
    ...a: [...infer A, infer _]
) => infer R
    ? (...a: A) => R
    : never;

type HistoryMiddlewareImpl = <T extends State>(
    storeInitializer: PopArgument<StateCreator<T, [], []>>,
    history: History
) => PopArgument<StateCreator<T, [], []>>;

const historyMiddlewareImpl: HistoryMiddlewareImpl =
    (initializer, history) => (set, get, store) => {
        type T = ReturnType<typeof initializer>;
        const commandFactory = createCommandFactory(history);

        store.setState = (updater, replace, ...a) => {
            if (typeof updater === "function") {
                const execute = () => {
                    const base = get();
                    const [nextState, _patches, inverse] = produceWithPatches(
                        base,
                        updater as (...args: any[]) => any
                    );

                    set(nextState, replace, ...a);

                    return () => set(applyPatches(get(), inverse));
                };

                const dispatch = commandFactory<void[]>(execute);

                dispatch();
            } else {
                const nextState = updater as T | Partial<T>;

                return set(nextState as any, replace, ...a);
            }
        };

        return initializer(store.setState, get, store);
    };

export const historyMiddleware =
    historyMiddlewareImpl as unknown as HistoryMiddleware;
