import classNames from "classnames"
import React from "react"

export type ToggleProps = {
    label: string
    checked?: boolean
    onChange?: (value: boolean) => void
}

const divStyle = "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
const divDarkStyle = "dark:peer-focus:ring-blue-800 dark:bg-gray-700 dark:border-gray-600"
const spanStyle = "ml-3 text-sm font-medium text-gray-900"
const spanDarkStyle = "dark:text-gray-300"

export const Toggle: React.FC<ToggleProps> = ({ checked, label, onChange }) => {
    return (
        <label className="inline-flex relative items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange?.(e.target.checked)} />
            <div className={classNames(divStyle)}></div>
            <span className={classNames(spanStyle)}>{label}</span>
        </label>
    )
}
