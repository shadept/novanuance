import classnames from "classnames"
import { GetServerSideProps } from "next"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { isEqual } from "../lib/date"
import { Employee, useEmployees, useHolidays, useVacations, Vacation } from "../lib/hooks"
import { SemiPartial } from "../lib/types"
import { Holiday } from "../server/router/holiday"

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

type VacationsCalendarProps = {
    year: number,
    month: number,
}

export const VacationsCalendar: React.FC<VacationsCalendarProps> = ({ year, month }) => {
    const employees = useEmployees(true)
    const holidays = useHolidays(year)
    const vacations = useVacations(year, month)

    const start = useMemo(() => new Date(Date.UTC(year, month - 1)), [year, month])
    const daysInMonth = new Date(year, month, 0).getDate()

    if (employees.data === undefined || holidays.data === undefined || vacations.data === undefined) {
        return <div>Loading...</div>
    }

    const onVacationChange = vacations.mutate

    return (
        <>
            <style>
                td {"{"}
                width: 0.1%;
                white-space: nowrap
                {"}"}
            </style>
            <table className="bg-white w-min mx-auto my-4 border">
                <thead>
                    <tr>
                        <th className="border px-2 py-1"></th>
                        {employees.data.map(e => <th key={e.id} className="border mx-auto py-3 font-semibold vertical-rl">{e.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {Array.from(Array(daysInMonth)).map((_, i) =>
                        <VacationCalendarRow key={i} start={start} index={i}
                            employees={employees.data} vacations={vacations.data} holidays={holidays.data}
                            onVacationChange={onVacationChange} />
                    )}
                </tbody>
            </table>
        </>
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

type VacationCalendarRowProps = {
    start: Date
    index: number
    vacations: Vacation[]
    employees: Employee[]
    holidays: Holiday[]
    onVacationChange: (vacation: SemiPartial<Vacation, "id">) => void
}

const VacationCalendarRow: React.FC<VacationCalendarRowProps> = ({ start, index, vacations, employees, holidays, onVacationChange }) => {
    const { t } = useTranslation()

    const current = useMemo(() => {
        const value = new Date(start)
        value.setDate(value.getDate() + index)
        return value
    }, [start, index])

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const holiday = holidays.find(h => isEqual(h.date, current))
    const isWorkingDay = workdays.includes(current.getDay()) && holiday === undefined

    return (
        <tr>
            <td className="border px-3 py-1 font-medium text-center text-gray-500">{current.toJSON().substring(0, 10)}</td>
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
                    tdProps.className = "border"
                    const vacationId = vacations.find(v => v.employeeId === e.id && isEqual(v.date, current))?.id
                    const buttonStyle = classnames("w-8 h-8 mx-auto", { "bg-blue-500": vacationId !== undefined })
                    tdProps.onClick = () => onVacationChange({ id: vacationId, employeeId: e.id, date: current })
                    tdProps.children = <div className={buttonStyle} />
                }
                return (<td key={e.id} {...tdProps} />)
            })}
        </tr>
    )
}


export default VacationsCalendar
