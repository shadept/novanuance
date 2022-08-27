import { zodResolver } from '@hookform/resolvers/zod'
import { createColumnHelper, flexRender, getCoreRowModel, PaginationState, useReactTable } from "@tanstack/react-table"
import classNames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps, useLayoutEffect, useMemo, useRef, useState } from "react"
import CurrencyInput from 'react-currency-input-field'
import { Controller, useForm } from "react-hook-form"
import { Trans, useTranslation } from 'react-i18next'
import * as z from 'zod'
import { Toggle } from '../components/toggle'
import { InventoryItem, InventoryItemInput, useDebouncedEffect, useEvent, useInventory } from "../lib/hooks"

const columnHelper = createColumnHelper<InventoryItem>()

type InventoryProps = {
    items: InventoryItem[]
}

const Inventory: React.FC<InventoryProps> = () => {
    const { t } = useTranslation()
    const [filter, setFilter] = useState<string>()
    const [searchTerm, setSearchTerm] = useState("")

    useDebouncedEffect(() => {
        setFilter(searchTerm !== "" ? searchTerm : undefined)
    }, 300, [searchTerm])

    const [stockMode, setStockMode] = useState<"none" | "increase" | "decrease">("none")
    const [selectedItem, setSelectedItem] = useState<ModalInventoryItem>()
    const InventoryColumns = useMemo(() => [
        columnHelper.accessor("name", {
            header: () => t("inventory.name"),
            cell: info => info.renderValue(),
        }),
        columnHelper.accessor("brand", {
            header: () => t("inventory.brand"),
            cell: info => info.renderValue(),
        }),
        columnHelper.accessor("quantity", {
            header: () => t("inventory.in_stock"),
            cell: info => info.renderValue(),
        }),
        columnHelper.accessor("price", {
            header: () => t("inventory.price"),
            cell: info => {
                const value = info.renderValue()
                if (value === null) return null
                return value.toFixed(2) + " €"
            },
        }),
        columnHelper.display({
            header: t("inventory.actions") as string,
            cell: info => <RowActions item={info.row.original} onEdit={setSelectedItem} onRemove={() => { }} />,
        })
    ], [])

    const inputRef = useRef<HTMLInputElement>(null)
    useLayoutEffect(() => inputRef.current?.focus(), [])

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
    const cursorByPage = useRef<Map<number, string | null>>(new Map())

    const pendingActions = useRef<Array<(newData: Exclude<typeof data, undefined>) => Promise<void>>>([])
    const { data, mutate, increaseStock, decreaseStock, invalidate } = useInventory(
        cursorByPage.current.get(pagination.pageIndex) ?? null, pagination.pageSize, filter,
        async (newData) => {
            cursorByPage.current.set(pagination.pageIndex + 1, newData.nextCursor)
            // do not allow pending actions when filter is not set
            if (filter === undefined && pendingActions.current === undefined) return
            await Promise.allSettled(pendingActions.current.map(a => a(newData)))
            pendingActions.current.splice(0, pendingActions.current.length)
        })

    const canCreate = searchTerm.match(/^(\d{8}|\d{12}|\d{13}|\d{14})$/) && data?.items.length === 0
    const handleInputKeyDown = useEvent((e: React.KeyboardEvent<HTMLInputElement>) => {
        const term = e.currentTarget.value
        if (e.key === "Enter") {
            if (term.match(/^(\d{8}|\d{12}|\d{13}|\d{14})$/)) {
                console.log("Setting pending barcode action", term)
                pendingActions.current.push(async (newData) => {
                    if (newData.items.length === 0) {
                        setSelectedItem(makeInventoryItem(term))
                    } else if (stockMode === "increase") {
                        await increaseStock(term)
                    } else if (stockMode === "decrease") {
                        await decreaseStock(term)
                    }
                })
                invalidate() // invalidate the filter to force a data update
            }
            inputRef.current?.select()
        }
    })

    const handleIncreaseToggle = useEvent(() => {
        setStockMode(stockMode === "increase" ? "none" : "increase")
        inputRef.current?.select()
    })

    const handleDecreaseToggle = useEvent(() => {
        () => setStockMode(stockMode === "decrease" ? "none" : "decrease")
        inputRef.current?.select()
    })

    const handleChange = useEvent((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    })

    const handleSave = useEvent((item: InventoryItemInput) => {
        mutate(item)
        setSelectedItem(undefined)
        inputRef.current?.focus()
    })

    const handleClose = useEvent(() => {
        setSelectedItem(undefined)
        inputRef.current?.focus()
    })

    const table = useReactTable({
        data: data?.items ?? [],
        columns: InventoryColumns,
        pageCount: data?.pages || -1,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    })

    return (
        <>
            <div>
                <div className="mb-4">
                    <input ref={inputRef} className="border rounded w-full py-2 px-3 text-gray-700" placeholder={t("inventory.search_placeholder")}
                        onChange={handleChange} onKeyDown={handleInputKeyDown} value={searchTerm} />
                </div>
                <div className="mb-4 flex items-center gap-4">
                    <Button disabled={!canCreate} onClick={() => setSelectedItem(makeInventoryItem(searchTerm))}>{t("inventory.create")}</Button>
                    <Toggle label={t("inventory.increase_stock")} checked={stockMode === "increase"} onChange={handleIncreaseToggle} />
                    <Toggle label={t("inventory.decrease_stock")} checked={stockMode === "decrease"} onChange={handleDecreaseToggle} />
                </div>
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} scope="col" className="group px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="py-3 flex items-center justify-between">
                    <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                            <Trans t={t} i18nKey={"inventory.paging"} values={{ index: pagination.pageIndex + 1, of: table.getPageCount() || t("inventory.many") }} components={{ b: <span className="font-medium" /> }} />
                        </span>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px">
                            <Button className="rounded-l-md" disabled={!table.getCanPreviousPage()} onClick={() => setPagination({ ...pagination, pageIndex: 0 })}>{t("inventory.first")}</Button>
                            <Button disabled={!table.getCanPreviousPage()} onClick={() => setPagination({ ...pagination, pageIndex: pagination.pageIndex - 1 })}>{t("inventory.previous")}</Button>
                            <Button disabled={!table.getCanNextPage()} onClick={() => setPagination({ ...pagination, pageIndex: pagination.pageIndex + 1 })}>{t("inventory.next")}</Button>
                            <Button className="rounded-r-md" disabled={!table.getCanNextPage() || data?.pages === undefined} onClick={() => setPagination({ ...pagination, pageIndex: data!.pages - 1 })}>{t("inventory.last")}</Button>
                        </nav>
                    </div>
                </div>
            </div>
            {selectedItem && <InventoryItemModal item={selectedItem} onSave={handleSave} onClose={handleClose} />}
        </>
    )
}

type RowActionsProps = {
    item: InventoryItem
    onEdit: (item: InventoryItem) => void
    onRemove: (item: InventoryItem) => void
}

const RowActions: React.FC<RowActionsProps> = ({ item, onEdit, onRemove }) => {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <Button title={t("inventory.edit")} onClick={() => onEdit(item)}><i className="fa-solid fa-pencil"></i></Button>
            <Button title={t("inventory.remove")} onClick={() => onRemove(item)}><i className="fa-solid fa-trash-can"></i></Button>
        </div>
    )
}

function makeInventoryItem(barcode?: string): ModalInventoryItem {
    return {
        brand: "",
        name: "",
        quantity: 0,
        price: 0,
        barcode: barcode ?? "",
        imageUrl: undefined,
        description: undefined
    }
}

type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

const inventoryItemSchema = z.object({
    id: z.string().cuid().nullish(),
    brand: z.string().min(1),
    name: z.string().min(1),
    price: z.string().transform(Number),
    quantity: z.number().min(0),
    barcode: z.string().min(8).max(14),
    description: z.string(),
})

type ModalInventoryItem = PartialKeys<InventoryItem, 'id'>
type InventorItemModalProps = {
    item: ModalInventoryItem
    onSave: (item: ModalInventoryItem) => void
    onClose: () => void
}

const InventoryItemModal: React.FC<InventorItemModalProps> = ({ item, onSave, onClose }) => {
    const { t } = useTranslation()
    type InventoryItemFormState = Omit<InventoryItem, 'price'> & { price: string }
    const { register, control, handleSubmit, formState: { errors } } = useForm<InventoryItemFormState>({
        defaultValues: { ...item, price: item.price.toFixed(2) },
        resolver: zodResolver(inventoryItemSchema)
    })
    const isCreating = item.id === undefined

    const handleSave = useEvent((data: InventoryItemFormState) => {
        const newItem = { ...data, price: Number(data.price) }
        console.log(newItem)
        onSave(newItem)
    })

    return (
        <Modal title={isCreating ? t("inventory.creating") : t("inventory.editing")} onClose={onClose}>
            <form onSubmit={handleSubmit(handleSave)}>
                <div className="grid grid-cols-3 gap-4" >
                    <div className="row-span-2">
                        <img className="m-auto h-40" alt="" src={item.imageUrl} />
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.brand")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" {...register("brand")} />
                        {errors.brand?.message && <p className="text-red-500">{errors.brand?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.name")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" {...register("name")} />
                        {errors.name?.message && <p className="text-red-500">{errors.name?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.price")}:</label>
                        <Controller name="price" control={control}
                            render={({ field: { onChange, value } }) => (
                                <CurrencyInput className="border rounded w-full py-2 px-3 text-gray-700"
                                    suffix="&nbsp;€" decimalScale={2}
                                    value={value} onValueChange={onChange} />
                            )}
                        />
                        {errors.price?.message && <p className="text-red-500">{errors.price?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.in_stock")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" {...register("quantity", { valueAsNumber: true })} />
                        {errors.quantity?.message && <p className="text-red-500">{errors.quantity?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.barcode")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" disabled {...register("barcode")} />
                        {errors.barcode?.message && <p className="text-red-500">{errors.barcode?.message}</p>}
                    </div>
                    <div className="col-span-2">
                        <label className="ml-2">{t("inventory.description")}:</label>
                        <textarea className="border rounded w-full py-2 px-3 text-gray-700" {...register("description")} rows={3} />
                        {errors.description?.message && <p className="text-red-500">{errors.description?.message}</p>}
                    </div>
                </div>
                <hr className="my-3" />
                <div className="flex justify-end">
                    <Button type="submit" className="rounded bg-green-500 border-green-500 text-white hover:bg-green-700">{isCreating ? t("inventory.create") : t("inventory.save")}</Button>
                </div>
            </form>
        </Modal>
    )
}

type ModalProps = {
    title: string
    onClose?: () => void
    children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
    return (
        <>
            <div className="fixed flex items-center justify-center overflow-x-hidden overflow-y-auto inset-0 z-50 outline-none focus:outline-none">
                <div className="relative w-auto my-6 mx-auto max-w-4xl">
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200">
                            <h3 className="text-3xl font-semibold">
                                {title}
                            </h3>
                            <div className="text-lg my-auto px-2" onClick={onClose}>
                                <i className="fa-solid fa-xmark"></i>
                            </div>
                        </div>
                        {/* Content */}
                        <div className="relative p-6 flex-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
    )
}

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
const Button: React.FC<ButtonProps> = ({ children, className, ...rest }) => {
    return (
        <button type="button" className={classNames("relative inline-flex items-center p-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 disabled:bg-gray-300 hover:bg-gray-50", className)} {...rest}>
            {children}
        </button>
    )
}


export default Inventory
