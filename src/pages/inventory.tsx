import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import classNames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"
import { InventoryItem } from "../lib/hooks"

const columnHelper = createColumnHelper<InventoryItem>()

const InventoryColumns = [
    columnHelper.accessor("name", {
        header: () => "Name",
        cell: info => info.renderValue(),
        footer: info => info.column.id,
    }),
    columnHelper.accessor("brand", {
        header: () => "Brand",
        cell: info => info.renderValue(),
        footer: info => info.column.id,
    }),
    columnHelper.accessor("quantity", {
        header: () => "In Stock",
        cell: info => info.renderValue(),
        footer: info => info.column.id,
    }),
    columnHelper.accessor("price", {
        header: () => "Price",
        cell: info => info.renderValue(),
        footer: info => info.column.id,
    }),
]

type InventoryProps = {
    items: InventoryItem[]
}

const Inventory: React.FC<InventoryProps> = () => {
    const items: InventoryItem[] = [
        {
            id: "",
            name: "Shampoo",
            brand: "Head & Shoulders",
            quantity: 69,
            price: 1.32,
            iconUrl: "",
            description: ""
        },
        {
            id: "",
            name: "Shampoo",
            brand: "Head & Shoulders",
            quantity: 69,
            price: 1.32,
            iconUrl: "",
            description: ""
        },
        {
            id: "",
            name: "Shampoo",
            brand: "Head & Shoulders",
            quantity: 69,
            price: 1.32,
            iconUrl: "",
            description: ""
        },
        {
            id: "",
            name: "Shampoo",
            brand: "Head & Shoulders",
            quantity: 69,
            price: 1.32,
            iconUrl: "",
            description: ""
        },
        {
            id: "",
            name: "Shampoo",
            brand: "Head & Shoulders",
            quantity: 69,
            price: 1.32,
            iconUrl: "",
            description: ""
        },
        {
            id: "",
            name: "Shampoo",
            brand: "Head & Shoulders",
            quantity: 69,
            price: 1.32,
            iconUrl: "",
            description: ""
        }
    ]
    const table = useReactTable({
        data: items,
        columns: InventoryColumns,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <div>
            <div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Search</label>
                    <input className="shadow appearance-non border rounded w-full py-2 px-3 text-gray-700"/>
                </div>
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
                        Page <span className="font-medium">{1}</span> of{" "}
                        <span className="font-medium">{table.getPageCount()}</span>
                    </span>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px">
                        <PageButton className="rounded-l-md" disabled={!table.getCanPreviousPage()}>
                            First
                        </PageButton>
                        <PageButton disabled={!table.getCanPreviousPage()}>
                            Previous
                        </PageButton>
                        <PageButton disabled={!table.getCanNextPage()}>
                            Next
                        </PageButton>
                        <PageButton className="rounded-r-md" disabled={!table.getCanNextPage()}>
                            Last
                        </PageButton>
                    </nav>
                </div>
            </div>
        </div>
    )
}

const PageButton: React.FC<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>> = ({ children, className, ...rest }) => {
    return (
        <button type="button" className={classNames("relative inline-flex items-center p-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50", className)} {...rest}>
            {children}
        </button>
    )
}


export default Inventory
