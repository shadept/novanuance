import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import CurrencyInput, { CurrencyInputProps } from "react-currency-input-field"
import { dateRange, isEqual } from "../lib/date"
import { Employee, Receipt, useDebouncedEffect, useDebouncedValue, useEmployees, useEvent, useHolidays, useReceipts, useVacations, Vacation } from "../lib/hooks"
import { Holiday } from "../server/router/holiday"
import { GetServerSideProps } from "next"


export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const year = Array.isArray(query.year) ? query.year[0] : query.year
    const month = Array.isArray(query.month) ? query.month[0] : query.month
    const today = new Date()
    return {
        props: {
            year: year ? parseInt(year) : today.getFullYear(),
            month: month ? parseInt(month) : today.getMonth() + 1,
        }
    }
}


type ReceiptCalendarProps = {
    year: number,
    month: number,
}


const ReceiptCalendar: React.FC<ReceiptCalendarProps> = ({ year, month }) => {
    const { t } = useTranslation()

    const employees = useEmployees()
    const holidays = useHolidays(year)
    const vacations = useVacations(year, month)
    const receipts = useReceipts(year, month)

    const start = useMemo(() => new Date(Date.UTC(year, month - 1)), [year, month])
    const daysInMonth = new Date(year, month, 0).getDate()

    if (employees.data === undefined || holidays.data === undefined || vacations.data === undefined || receipts.data === undefined) {
        return <div>{t("loading")}</div>
    }

    const onReceiptChange = (receipt: Receipt) => {
        receipts.mutate(receipt)
    }

    return (
        <table className="bg-white w-full">
            <thead>
                <tr>
                    <th className="px-3 py-1"></th>
                    {employees.data.map(e => <th key={e.id} className="border px-3 py-1 font-semibold text-center">{e.name}</th>)}
                    <th className="border px-3 py-1 font-semibold text-center">{t("Daily Total")}</th>
                </tr>
            </thead>
            <tbody>
                {Array.from(Array(daysInMonth)).map((_, i) => (
                    <ReceiptCalendarRow key={i} start={start} index={i}
                        employees={employees.data}
                        vacations={vacations.data}
                        receipts={receipts.data}
                        holidays={holidays.data}
                        onReciteChange={onReceiptChange}
                    />))}
                <tr>
                    <td className="border px-3 py-1 font-semibold text-right">{t("Total")}</td>
                    {employees.data.map(e =>
                        <td key={e.id} className="border px-3 py-1 text-right">
                            {receipts.data
                                .filter(r => r.employeeId === e.id)
                                .reduce((acc, cur) => acc + cur.amount, 0.0)
                                .toFixed(2)}&nbsp;€
                        </td>
                    )}
                    <td className="border px-3 py-1 text-right">{receipts.data.reduce((acc, cur) => acc + cur.amount, 0.0).toFixed(2)}&nbsp;€</td>
                </tr>
            </tbody>
        </table>
    )
}

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

type ReceiptCalendarRowProps = {
    index: number
    start: Date
    employees: Employee[]
    vacations: Vacation[]
    receipts: Receipt[]
    holidays: Holiday[]
    onReciteChange: (value: Receipt) => void
}


const ReceiptCalendarRow: React.FC<ReceiptCalendarRowProps> = ({ index, start, employees, receipts, vacations, holidays, onReciteChange }) => {
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
    const holiday = holidays.find(h => isEqual(h.date, current))
    const isWorkingDay = workdays.includes(current.getDay()) && holiday === undefined

    const handleChange = useEvent((amount: number, employeeId: string) => {
        onReciteChange({ employeeId, date: current, amount })
    })
    const date = current.toJSON().substring(0, 10)
    const previousMonday = new Date(current)
    previousMonday.setDate(current.getDate() - (current.getDay() === 0 ? 7 : current.getDay()))

    return (
        <tr>
            <td className="border px-3 py-1 font-medium text-center text-gray-500">{date}</td>
            {employees.map((e, column) => {
                if (!(isWorkingDay || column === 0)) return null
                const tdProps = {} as React.ComponentProps<'td'>
                tdProps.className = "border px-3 py-1"
                if (holiday !== undefined) {
                    tdProps.colSpan = employees.length + 1
                    tdProps.children = holiday.localName
                    tdProps.className += " text-center font-medium text-gray-500"
                } else if (!isWorkingDay) {
                    tdProps.colSpan = employees.length + 1
                    tdProps.children = t(daysOfTheWeek[current.getDay()] as string)
                    tdProps.className += " text-center font-medium text-gray-500"
                } else {
                    const vacation = vacations.find(v => v.employeeId === e.id && isEqual(v.date, current))
                    const receipt = receipts.find(r => r.employeeId === e.id && isEqual(r.date, current))
                    const value = vacation === undefined ? receipt?.amount ?? 0 : undefined
                    tdProps.children = <ReceiptInput key={`${e.id}-${date}`} employeeId={e.id} value={current < tomorrow ? value: undefined} onChange={handleChange} />
                }
                return (<td key={e.id} {...tdProps} />)
            })}
            {isWorkingDay && (
                <td className="border px-3 py-1 text-right">
                    {receipts.filter(r => isEqual(r.date, current)).reduce((acc, cur) => acc + cur.amount, 0.0).toFixed(2)}&nbsp;€
                </td>
            )}
            {current.getDay() === 0 && (
                <td className="border px-3 py-1 text-right">
                    {receipts.filter(r => previousMonday <= r.date && r.date <= current).reduce((acc, cur) => acc + cur.amount, 0.0).toFixed(2)}&nbsp;€
                </td>
            )}
        </tr>
    )
}

type ReceiptInputProps = {
    employeeId: string
    value: number | undefined
    onChange: (newValue: number, employeeId: string) => void
}

const ReceiptInput: React.FC<ReceiptInputProps> = ({ employeeId, value, onChange }) => {
    const disabled = value === undefined
    const [localValue, setLocalValue] = useState(value?.toFixed(2) || "")
    const [float, setFloat] = useState(value)

    // call event handler after debounce has settled
    useDebouncedEffect(() => {
        if (float !== value) {
            onChange(float || 0.0, employeeId)
        }
    }, 500, [float, value, employeeId, onChange])

    const handleChange: CurrencyInputProps['onValueChange'] = (value, _, values) => {
        setFloat(values?.float ?? undefined)
        setLocalValue(value || "")
    }

    return (
        <div className="flex justify-end">
            {/* <input className="mx-3" type="checkbox" disabled={disabled} checked={true} /> */}
            <CurrencyInput className="w-24 px-1 text-right focus:outline-blue-500"
                disabled={disabled}
                placeholder="-"
                suffix="&nbsp;€"
                decimalScale={2}
                value={!disabled ? (localValue || 0) : undefined}
                onValueChange={handleChange} />
        </div>
    )
}

export default ReceiptCalendar
