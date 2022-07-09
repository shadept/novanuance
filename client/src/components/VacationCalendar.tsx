import classnames from "classnames";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Employee, EmployeeId } from "../model/Employee";
import { PublicHoliday } from "../model/PublicHoliday";
import { Vacation } from "../model/Vacation";

type VacationsCalendarProps = {
    year: number
    month: number
    vacations: Record<EmployeeId, (string | null)[]>
    employees: Employee[]
    holidays: Record<string, PublicHoliday>
    onVacationChange: (vacation: Vacation) => void
}

export const VacationsCalendar: React.FC<VacationsCalendarProps> = ({ year, month, vacations, employees, holidays, onVacationChange }) => {
    const start = useMemo(() => new Date(Date.UTC(year, month - 1)), [year, month])
    const daysInMonth = new Date(year, month, 0).getDate()

    return (
        <>
            <style>
                td {"{"}
                width: 0.1%;
                white-space: nowrap
                {"}"}
            </style>
            <table className="bg-white w-min mx-auto border">
                <thead>
                    <tr>
                        <th className="border px-2 py-1"></th>
                        {employees.map(e => <th key={e.id} className="border mx-auto py-3 font-semibold rotate-180 vertical-rl">{e.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(daysInMonth).keys()].map(i => <VacationCalendarRow key={i} start={start} index={i} employees={employees} vacations={vacations} holidays={holidays} onVacationChange={onVacationChange} />)}
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
    vacations: Record<EmployeeId, (string | null)[]>
    employees: Employee[]
    holidays: Record<string, PublicHoliday>
    onVacationChange: (vacation: Vacation) => void
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
    const holiday = holidays[current.toJSON().substring(0, 10)]
    const isWorkingDay = workdays.includes(current.getDay()) && holiday === undefined

    return (
        <tr>
            <td className="border px-3 py-1 font-medium text-center text-gray-500">{current.toJSON().substring(0, 10)}</td>
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
                    tdProps.className = "border"
                    const vacationId = vacations[e.id][index]
                    const isOnVacation = vacationId !== null
                    const buttonStyle = classnames("w-8 h-8 mx-auto", {
                        "bg-blue-500": isOnVacation
                    })
                    tdProps.onClick = () => onVacationChange({ id: vacationId, employeeId: e.id, date: current, isOnVacation: !isOnVacation })
                    tdProps.children = <div className={buttonStyle} />
                }
                return (<td {...tdProps} />)
            })}
        </tr>
    )
}
