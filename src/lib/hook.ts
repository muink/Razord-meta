import { Draft } from 'immer'
import { useImmer } from 'use-immer'
import { createContainer } from 'unstated-next'

export function useObject<T extends object> (initialValue: T) {
    const [copy, rawSet] = useImmer(initialValue)

    function set<K extends keyof Draft<T>> (key: K, value: Draft<T>[K]): void
    function set<K extends keyof Draft<T>> (data: Partial<T>): void
    function set<K extends keyof Draft<T>> (f: (draft: Draft<T>) => void | T): void
    function set<K extends keyof Draft<T>> (data: any, value?: Draft<T>[K]): void {
        if (typeof data === 'string') {
            rawSet(draft => {
                const key = data as K
                const v = value
                draft[key] = v
            })
        } else if (typeof data === 'function') {
            rawSet(data)
        } else if (typeof data === 'object') {
            rawSet((draft: Draft<T>) => {
                const obj = data as Draft<T>
                for (const key of Object.keys(obj)) {
                    const k = key as keyof Draft<T>
                    draft[k] = obj[k]
                }
            })
        }
    }

    return [copy, set] as [T, typeof set]
}

type containerFn<Value, State = void> = (initialState?: State) => Value

export function composeContainer<T, C extends containerFn<T>, U extends { [key: string]: C }, K extends keyof U> (mapping: U) {
    function Global () {
        return Object.keys(mapping).reduce((obj, key) => {
            obj[key as K] = mapping[key]()
            return obj
        }, {} as { [K in keyof U]: T })
    }

    const allContainer = createContainer(Global)
    return {
        Provider: allContainer.Provider,
        containers: Object.keys(mapping).reduce((obj, key) => {
            obj[key as K] = (() => allContainer.useContainer()[key]) as U[K]
            return obj
        }, {} as { [K in keyof U]: U[K] })
    }
}
