import type { DependencyList, EffectCallback } from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { InferMutationInput, InferQueryOutput, trpc } from "../utils/trpc"
import { SemiPartial } from "./types"


export const useDebouncedEffect = (
    effect: EffectCallback,
    delay: number,
    deps?: DependencyList,
) => {
    useEffect(() => {
        const handler = setTimeout(effect, delay);
        return () => clearTimeout(handler);
    }, [...(deps || []), delay]); // @eslint-disable-line react-hooks/exhaustive-deps
}

export const useDebouncedValue = <T>(value: T, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

export const useEvent = <T extends Function>(handler: T): T => {
    const handlerRef = useRef(handler);

    // In a real implementation, this would run before layout effects
    useLayoutEffect(() => {
        handlerRef.current = handler;
    });

    // @ts-ignore
    return useCallback((...args) => {
        // In a real implementation, this would throw if called during render
        const fn = handlerRef.current;
        return fn(...args);
    }, []);
}

const useEventOncePerUpdate = <T extends Function>(handler: T): T => {
    const ref = useRef<boolean>(true)
    useEffect(() => {
        ref.current = true
    })
    // @ts-ignore
    return useEvent((...args) => {
        if (ref.current) {
            ref.current = false;
            handler(...args)
        }
    })
}

export type Employee = InferQueryOutput<"employee.byMonth">[0]

export const useEmployees = (year: number, month: number, excludeOwner: boolean = false) => {
    const employees = trpc.useQuery(["employee.byMonth", { year, month, excludeOwner }])
    return employees
}

export type Holiday = InferQueryOutput<"holiday.byYear">[0]

export const useHolidays = (year: number) => {
    const holidays = trpc.useQuery(["holiday.byYear", { year }])
    return holidays
}

export type Receipt = InferQueryOutput<"receipt.byMonth">[0]

export const useReceipts = (year: number, month: number, employeeId?: Employee["id"]) => {
    const utils = trpc.useContext()
    const receipts = trpc.useQuery(["receipt.byMonth", { year, month, employeeId }])
    const updateReceipt = trpc.useMutation(["receipt.update"], {
        onMutate: async (newReceipt: Receipt) => {
            await utils.cancelQuery(["receipt.byMonth", { year, month, employeeId }])
            const previousReceipts = utils.getQueryData(["receipt.byMonth", { year, month, employeeId }])
            if (previousReceipts) {
                utils.setQueryData(["receipt.byMonth", { year, month, employeeId }], [
                    ...previousReceipts,
                    newReceipt,
                ])
            }
            return { previousReceipts }
        },
        onError: (err, variables, context) => {
            if (context?.previousReceipts) {
                utils.setQueryData(["receipt.byMonth", { year, month, employeeId }], context.previousReceipts)
            }
        },
        onSettled: () => utils.invalidateQueries(["receipt.byMonth", { year, month, employeeId }])
    })
    const mutate = useEvent((receipt: Receipt) => {
        updateReceipt.mutateAsync(receipt)
    })
    return { ...receipts, mutate }
}

export type Vacation = InferQueryOutput<"vacation.byMonth">[0]

export const useVacations = (year: number, month: number, employeeId?: Employee["id"]) => {
    const utils = trpc.useContext()
    const vacations = trpc.useQuery(["vacation.byMonth", { year, month, employeeId }])
    const invalidate = () => utils.invalidateQueries(["vacation.byMonth", { year, month, employeeId }])
    const updateVacation = trpc.useMutation(["vacation.update"], { onSettled: invalidate })
    const deleteVacation = trpc.useMutation(["vacation.delete"], { onSettled: invalidate })
    const mutate = useEvent((vacation: SemiPartial<Vacation, "id">) => {
        if (vacation.id === undefined) {
            return updateVacation.mutateAsync(vacation)
        } else {
            return deleteVacation.mutateAsync({ id: vacation.id })
        }
    })
    return { ...vacations, mutate, invalidate }
}

export type InventoryItem = InferQueryOutput<"inventory.getAll">["items"][0]
export type InventoryItemInput = InferMutationInput<"inventory.update">

export const useInventory = (cursor: string | null, limit: number, filter?: string, onSuccess?: (data: InferQueryOutput<"inventory.getAll">) => Promise<void>) => {
    const utils = trpc.useContext()
    const inventory = trpc.useQuery(["inventory.getAll", { filter, limit, cursor }], { onSuccess })
    const invalidate = () => utils.invalidateQueries(["inventory.getAll", { filter, limit, cursor }])
    const updateInventory = trpc.useMutation(["inventory.update"], { onSettled: invalidate })
    const increaseInventoryStock = trpc.useMutation(["inventory.increaseStock"], { onSettled: invalidate })
    const decreaseInventoryStock = trpc.useMutation(["inventory.decreaseStock"], { onSettled: invalidate })
    const mutate = useEvent((item: InventoryItemInput) => {
        return updateInventory.mutateAsync(item)
    })
    const increaseStock = useEvent((barcode: string) => {
        return increaseInventoryStock.mutateAsync(barcode)
    })
    const decreaseStock = useEvent((barcode: string) => {
        return decreaseInventoryStock.mutateAsync(barcode)
    })
    return { ...inventory, mutate, increaseStock, decreaseStock, invalidate }
}

export const useInventoryStockHistory = (itemId: string, daysBefore: number) => {
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    start.setDate(start.getDate() - daysBefore)
    const history = trpc.useQuery(["inventory.getStockHistory", { itemId, start }])
    return { ...history }
}
