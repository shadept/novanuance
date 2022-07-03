import { PublicHoliday } from "../model/PublicHoliday"
import { EmployeeRecite } from "../model/EmployeeRecite"
import { Employee, EmployeeId } from "../model/Employee"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { tuple } from "../util"
import { useTranslation } from "react-i18next"
import CurrencyInput from "react-currency-input-field"

export type ReciteCalendarProps = {
    year: number
    month: number
    holidays: Record<string, PublicHoliday>
    employees: Employee[]
    vacations: Record<EmployeeId, (string | null)[]>
    recites: Record<EmployeeId, number[]>
    onReciteChange: (value: EmployeeRecite) => void
}

export const ReciteCalendar: React.FC<ReciteCalendarProps> = ({ year, month, holidays, employees, vacations, recites, onReciteChange }) => {
    const { t } = useTranslation()
    const start = useMemo(() => new Date(Date.UTC(year, month - 1)), [year, month])
    const daysInMonth = new Date(year, month, 0).getDate()

    return (
        <table className="bg-white w-full border">
            <thead>
                <tr>
                    <th className="border px-3 py-1"></th>
                    {employees.map(e => <th key={e.id} className="border px-3 py-1 font-semibold text-center">{e.name}</th>)}
                    <th className="border px-3 py-1 font-semibold text-center">{t("Daily Total")}</th>
                </tr>
            </thead>
            <tbody>
                {[...Array(daysInMonth).keys()].map(i => (
                    <ReciteCalendarRow key={i} start={start} index={i}
                        employees={employees}
                        vacations={vacations}
                        recites={recites}
                        holidays={holidays}
                        onReciteChange={onReciteChange}
                    />))}
                <tr>
                    <td className="border px-3 py-1 font-semibold text-right">{t("Total")}</td>
                    {employees.map(e =>
                        <td key={e.id} className="border px-3 py-1 text-right">
                            {recites[e.id].reduce((acc, cur) => acc + cur, 0.0).toFixed(2)} €
                        </td>
                    )}
                </tr>
            </tbody>
        </table>
    )
}

const compare = (left: Date, right: Date) => (right.getFullYear() - left.getFullYear()) || (right.getMonth() - left.getMonth()) || (right.getDate() - left.getDate())

const daysOfTheWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]

const workdays = [1, 2, 3, 4, 5, 6]

type ReciteCalendarRowProps = {
    index: number
    start: Date
    employees: Employee[]
    vacations: Record<EmployeeId, (string | null)[]>
    recites: Record<EmployeeId, number[]>
    holidays: Record<string, PublicHoliday>
    onReciteChange: (value: EmployeeRecite) => void
}


const ReciteCalendarRow: React.FC<ReciteCalendarRowProps> = ({ index, start, employees, recites, vacations, holidays, onReciteChange }) => {
    // useWhyDidYouUpdate("ReciteCalendarRow", props)
    const { t } = useTranslation()
    // Need to memoize for useCallback below
    const current = useMemo(() => {
        const value = new Date(start)
        value.setDate(value.getDate() + index)
        return value
    }, [start, index])

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const holiday = holidays[current.toJSON().substring(0, 10)]
    const rowVacations = employees
        .map(e => tuple(e.id, vacations[e.id][index]))
        .reduce((acc, [k, v]) => (acc[k] = v, acc), {} as Record<EmployeeId, string | null>)
    const rowRecites = employees
        .map(e => tuple(e.id, rowVacations[e.id] === null ? recites[e.id][index] : null))
        .reduce((acc, [k, v]) => (acc[k] = compare(current, tomorrow) > 0 ? v : null, acc), {} as Record<EmployeeId, number | null>)

    const isWorkingDay = workdays.includes(current.getDay()) && holiday === undefined

    const handleChange = useCallback((value: number, employeeId: string) => {
        onReciteChange({ date: current, employeeId, value } as EmployeeRecite)
    }, [current, onReciteChange])
    const date = current.toJSON().substring(0, 10)

    return (
        <tr>
            <td className="border px-3 py-1 font-medium text-center text-gray-500">{date}</td>
            {employees.map((e, column) => {
                if (!(isWorkingDay || column === 0)) return null
                const tdProps = {} as React.ComponentProps<'td'>
                tdProps.key = e.id
                tdProps.className = "border px-3 py-1"
                if (holiday !== undefined) {
                    tdProps.colSpan = employees.length + 1
                    tdProps.children = holiday.localName
                    tdProps.className += " text-center font-medium text-gray-500"
                } else if (!isWorkingDay) {
                    tdProps.colSpan = employees.length + 1
                    tdProps.children = t(daysOfTheWeek[current.getDay()])
                    tdProps.className += " text-center font-medium text-gray-500"
                } else {
                    tdProps.children = <ReciteInput key={`${e.id}-${date}`} employeeId={e.id} value={rowRecites[e.id]} onChange={handleChange} />
                }
                return (<td {...tdProps} />)
            })}
            {isWorkingDay && (
                <td className="border px-3 py-1 text-right">
                    {Object.values(rowRecites).filter(r => r !== null).length === 0 ? "-"
                        : Object.values(rowRecites).reduce((acc: number, cur) => acc + (cur || 0.0), 0.0)
                    } €
                </td>
            )}
        </tr>
    )
}

type ReciteInputProps = {
    employeeId: string
    value: number | null
    onChange: (newValue: number, employeeId: string) => void
}

const ReciteInput: React.FC<ReciteInputProps> = ({ employeeId, value, onChange }) => {
    const [localValue, setLocalValue] = useState(value?.toFixed(2))
    const debouncedValue = useDebounce(localValue, 500)

    // call event handler after debounce has settled
    useEffect(() => {
        const float = Number(debouncedValue)
        !Number.isNaN(float) && value !== float && onChange(float, employeeId)
    }, [value, debouncedValue, employeeId, onChange])

    const handleChange = useCallback((newValue: string | undefined) => {
        setLocalValue(newValue)
    }, [])

    const disabled = localValue === undefined
    return (
        <div className="flex justify-end">
            {/* <input className="mx-3" type="checkbox" disabled={disabled} checked={true} /> */}
            <CurrencyInput className="w-24 px-1 text-right focus:outline-blue-500"
                disabled={disabled}
                placeholder="-"
                suffix=" €"
                decimalScale={2}
                value={!disabled ? (localValue || 0) : undefined}
                onValueChange={handleChange} />
        </div>
    )
}





function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

// Hook
function useWhyDidYouUpdate(name: string, props: any) {
    // Get a mutable ref object where we can store props ...
    // ... for comparison next time this hook runs.
    const previousProps = useRef<any>();
    useEffect(() => {
        if (previousProps.current) {
            // Get all keys from previous and current props
            const allKeys = Object.keys({ ...previousProps.current, ...props });
            // Use this object to keep track of changed props
            const changesObj = {} as any;
            // Iterate through keys
            allKeys.forEach((key) => {
                // If previous is different from current
                if (previousProps.current[key] !== props[key]) {
                    // Add to changesObj
                    changesObj[key] = {
                        from: previousProps.current[key],
                        to: props[key],
                    };
                }
            });
            // If changesObj not empty then output to console
            if (Object.keys(changesObj).length) {
                console.log("[why-did-you-update]", name, changesObj);
            }
        }
        // Finally update previousProps with current props for next hook call
        previousProps.current = props;
    });
}
