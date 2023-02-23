import { zodResolver } from '@hookform/resolvers/zod'
import { createColumnHelper, flexRender, getCoreRowModel, PaginationState, useReactTable } from "@tanstack/react-table"
import { ApexOptions } from 'apexcharts'
import dynamic from 'next/dynamic'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import CurrencyInput from 'react-currency-input-field'
import { Controller, useController, UseControllerProps, useForm } from "react-hook-form"
import { Trans, useTranslation } from 'react-i18next'
import { ReactTagsProps, WithContext as ReactTags } from 'react-tag-input'
import * as z from 'zod'
import { Button } from '../components/button'
import { Modal, RemovePromptModal } from '../components/modal'
import { Toggle } from '../components/toggle'
import { InventoryItem, InventoryItemInput, useDebouncedEffect, useEvent, useInventory, useInventoryStockHistory } from "../lib/hooks"

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

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
    const [selectedChart, setSelectedChart] = useState<InventoryItem>()
    const [pendingRemove, setPendingRemove] = useState<InventoryItem>()

    const InventoryColumns = useMemo(() => [
        columnHelper.accessor("name", {
            header: () => t("inventory.name"),
            cell: info => info.renderValue(),
        }),
        columnHelper.accessor("brand", {
            header: () => t("inventory.brand"),
            cell: info => [info.renderValue(), info.row.original.subBrand].filter(x => !!x).join(" / "),
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
            header: t("inventory.totalPrice") as string,
            cell: info => {
                const { quantity, price } = info.row.original
                const value = quantity * price
                return value.toFixed(2) + " €"
            },
            footer: ({ table }) => table.getFilteredRowModel().rows
                .reduce((total, row) => total + row.getValue<number>("quantity") * row.getValue<number>("price"), 0.0).toFixed(2) + " €"
        }),
        columnHelper.display({
            header: t("inventory.actions") as string,
            cell: info => <RowActions item={info.row.original} onEdit={setSelectedItem} onChart={setSelectedChart} onRemove={setPendingRemove} />,
        })
    ], [])

    const inputRef = useRef<HTMLInputElement>(null)
    useLayoutEffect(() => inputRef.current?.focus(), [])

    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
    const cursorByPage = useRef<Map<number, string | null>>(new Map())

    const pendingActions = useRef<Array<(newData: Exclude<typeof data, undefined>) => Promise<void>>>([])
    const { data, mutate, remove, increaseStock, decreaseStock, invalidate } = useInventory(
        cursorByPage.current.get(pagination.pageIndex) ?? null, pagination.pageSize, filter,
        async (newData) => {
            cursorByPage.current.set(pagination.pageIndex + 1, newData.nextCursor)
            // do not allow pending actions when filter is not set
            if (filter === undefined || pendingActions.current.length === 0) return
            console.log(`Resolving ${pendingActions.current.length} pending actions`)
            const actions = pendingActions.current.splice(0)
            await Promise.allSettled(actions.map(a => a(newData)))
        })

    const canCreate = searchTerm.match(/^(\d{8}|\d{12}|\d{13}|\d{14})$/) && data?.items.length === 0
    const handleInputKeyDown = useEvent((e: React.KeyboardEvent<HTMLInputElement>) => {
        const term = e.currentTarget.value
        if (e.key === "Enter") {
            if (term.match(/^(\d{8}|\d{12}|\d{13}|\d{14})$/)) {
                console.log("Setting pending barcode action", term)
                pendingActions.current.push(async (newData) => {
                    if (newData.items.length === 0) {
                        setSelectedItem(makeInventoryItem(term, stockMode === "increase" ? 1 : 0))
                    } else if (stockMode === "increase") {
                        console.log("Increasing stock")
                        await increaseStock(term)
                    } else if (stockMode === "decrease" && newData.items[0]!.quantity > 0) {
                        console.log("Decreasing stock")
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
        setStockMode(stockMode === "decrease" ? "none" : "decrease")
        inputRef.current?.select()
    })

    const handleChange = useEvent((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    })

    const handleSave = useEvent(async (item: ModalInventoryItem) => {
        await mutate(item)
        setSelectedItem(undefined)
        inputRef.current?.focus()
    })

    const handleClose = useEvent(() => {
        setSelectedItem(undefined)
        inputRef.current?.focus()
    })

    const handleRemove = useEvent(async () => {
        if (pendingRemove !== undefined) {
            await remove(pendingRemove)
            setPendingRemove(undefined)
        }
        inputRef.current?.focus()
    })

    const table = useReactTable({
        data: data?.items ?? [],
        columns: InventoryColumns,
        pageCount: data?.pages || 0,
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
                    <Button disabled={!canCreate} onClick={() => setSelectedItem(makeInventoryItem(searchTerm, stockMode === "increase" ? 1 : 0))}>{t("inventory.create")}</Button>
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
                    {table.getRowModel().rows.length === 0 &&
                        <div className="m-auto p-8 text-center font">
                            No items found
                        </div>
                    }
                </div>
                <div className="py-3 flex items-center justify-between">
                    <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                            <Trans t={t} i18nKey={"inventory.paging"}
                                components={{ b: <span className="font-medium" /> }}
                                values={{ index: pagination.pageIndex + 1, of: table.getPageCount() ?? t("inventory.many") }}
                            />
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
            {selectedChart && <InventoryChartModal item={selectedChart} onClose={() => setSelectedChart(undefined)} />}
            {pendingRemove && <RemovePromptModal title={t("inventory.remove")} prompt={
                <Trans t={t} i18nKey={"inventory.removePrompt"}
                    components={{ b: <span className="font-medium" /> }}
                    values={pendingRemove} />}
                preferredChoice='no' onYes={handleRemove} onNo={() => setPendingRemove(undefined)} />}
        </>
    )
}

type RowActionsProps = {
    item: InventoryItem
    onEdit: (item: InventoryItem) => void
    onChart: (item: InventoryItem) => void
    onRemove: (item: InventoryItem) => void
}

const RowActions: React.FC<RowActionsProps> = ({ item, onEdit, onChart, onRemove }) => {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <Button title={t("inventory.edit")} onClick={() => onEdit(item)}><i className="fa-solid fa-pencil"></i></Button>
            <Button title={t("inventory.history")} onClick={() => onChart(item)}><i className="fa-solid fa-chart-line"></i></Button>
            <Button title={t("inventory.remove")} onClick={() => onRemove(item)}><i className="fa-solid fa-trash-can"></i></Button>
        </div>
    )
}

function makeInventoryItem(barcode?: string, initialStock: number = 0): ModalInventoryItem {
    return {
        brand: "",
        subBrand: "",
        name: "",
        quantity: initialStock,
        price: 0,
        barcode: barcode ?? "",
        imageUrl: undefined,
        description: undefined,
        tags: [],
    }
}

type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

const inventoryItemSchema = z.object({
    id: z.string().cuid().nullish(),
    brand: z.string().min(1),
    subBrand: z.string().nullish(),
    name: z.string().min(1),
    price: z.string().transform(Number),
    quantity: z.number().min(0),
    barcode: z.string().min(8).max(14),
    description: z.string(),
    tags: z.array(z.string()),
})

type ModalInventoryItem = PartialKeys<InventoryItem, 'id'>
type InventorItemModalProps = {
    item: ModalInventoryItem
    onSave: (item: ModalInventoryItem) => void
    onClose: () => void
}

const reactTagsClassNames: ReactTagsProps["classNames"] = {
    tag: "inline-block p-1 mb-1 mr-1 bg-blue-500 text-white",
    remove: "pl-1 text-white",
    tagInputField: "inline-block p-1 border rounded w-full text-gray-700",

}

type InventoryItemFormState = Omit<InventoryItem, 'price'> & { price: string }
const InventoryItemModal: React.FC<InventorItemModalProps> = ({ item, onSave, onClose }) => {
    const { t } = useTranslation()
    const { register, control, handleSubmit, formState: { errors } } = useForm<InventoryItemFormState>({
        defaultValues: { ...item, price: item.price.toFixed(2), },
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
                    <div className="row-span-3">
                        <img className="m-auto h-40" alt="" src={item.imageUrl} />
                    </div>
                    <div className="col-span-2">
                        <label className="ml-2">{t("inventory.name")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" {...register("name")} />
                        {errors.name?.message && <p className="text-red-500">{errors.name?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.brand")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" {...register("brand")} />
                        {errors.brand?.message && <p className="text-red-500">{errors.brand?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.subBrand")}:</label>
                        <input className="border rounded w-full py-2 px-3 text-gray-700" {...register("subBrand")} />
                        {errors.brand?.message && <p className="text-red-500">{errors.subBrand?.message}</p>}
                    </div>
                    <div>
                        <label className="ml-2">{t("inventory.price")}:</label>
                        <Controller name="price" control={control}
                            render={({ field: { onChange, value } }) => (
                                <CurrencyInput className="border rounded w-full py-2 px-3 text-gray-700"
                                    suffix="&nbsp;€" decimalScale={2}
                                    value={value} onValueChange={v => onChange(v)} />
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
                    <div className="col-span-2 row-span-2">
                        <label className="ml-2">{t("inventory.description")}:</label>
                        <textarea className="border rounded w-full py-2 px-3 text-gray-700" {...register("description")} rows={3} />
                        {errors.description?.message && <p className="text-red-500">{errors.description?.message}</p>}
                    </div>
                    <div>
                        {/* <Tags control={control} name="tags" /> */}
                        <label className="ml-2">{t("inventory.tags")}:</label>
                        <Controller name="tags" control={control}
                            render={({ field: { onChange, value, ref } }) => (
                                <ReactTags ref={ref} tags={value.map(t => ({ id: t, text: t }))}
                                    handleAddition={t => {
                                        onChange([...value, t.text.toLowerCase()])
                                    }}
                                    handleDelete={idx => {
                                        onChange(value.filter((_, i) => i !== idx))
                                    }}
                                    classNames={reactTagsClassNames}/>
                            )}
                        />
                        {errors.price?.message && <p className="text-red-500">{errors.price?.message}</p>}
                    </div>
                </div>
                <hr className="my-3" />
                <div className="flex justify-end">
                    <Button type="submit" className="rounded bg-green-500 border-green-500 text-white hover:bg-green-700">
                        {isCreating ? t("inventory.create") : t("inventory.save")}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

const Tags: React.FC<UseControllerProps<InventoryItemFormState>> = ({ control }) => {
    const { field } = useController({ control, name: "tags", defaultValue: [] })
    const [values, setValues] = useState(field.value)

    return (
        <ReactTags tags={values.map(t => ({ id: t, text: t }))}
            handleAddition={t => {
                const newValue = [...values, t.text]
                field.onChange(newValue)
                setValues(newValue)
            }}
            handleDelete={idx => {
                const newValue = values.filter((_, i) => i !== idx)
                field.onChange(newValue)
                setValues(newValue)
            }} />
    )
}

type InventorChartModalProps = {
    item: InventoryItem
    onClose: () => void
}

const InventoryChartModal: React.FC<InventorChartModalProps> = ({ item, onClose }) => {
    const { t } = useTranslation()
    const [days, setDays] = useState(30)
    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: "line",
            toolbar: { show: false },
            animations: { enabled: false },
        },
        stroke: {
            curve: "stepline",
            width: 3,
        },
        tooltip: {
            x: { format: "yyyy MMM dd" },
        },
        yaxis: {
            tickAmount: 1,
        },
        xaxis: {
            type: "datetime",
        },
    }), [])

    const { data } = useInventoryStockHistory(item.id, days)
    const series: ApexOptions['series'] = [
        {
            name: t("inventory.in_stock"),
            data: data?.map(d => ({ y: d.quantity, x: d.date })) ?? [],
        }
    ]

    return (
        <Modal title={`${item.brand} - ${item.name} / ` + t("inventory.history")} onClose={onClose}>
            <select title={t("inventory.days")} value={days} onChange={e => setDays(Number(e.target.value))}>
                <option value={7}>7</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
            </select>
            <label className="p-2">{t("inventory.days")}</label>
            <ReactApexChart options={options} series={series} width={800} height={600} />
        </Modal>
    )
}

export default Inventory
