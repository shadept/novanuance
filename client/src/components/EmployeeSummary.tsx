import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { dateRange, dateRangeArray, isWeekend } from "../date"
import { calcPaycheck, Employee, EmployeeId, round } from "../model/Employee"
import { PublicHoliday } from "../model/PublicHoliday"

export type EmployeeSummaryListProps = {
    year: number
    month: number
    employees: Employee[]
    holidays: Record<string, PublicHoliday>
    vacations: Record<EmployeeId, (string | null)[]>
    recites: Record<string, number[]>
}

export const EmployeeSummaryList: React.FC<EmployeeSummaryListProps> = ({ year, month, employees, holidays, vacations, recites }) => {
    const { t } = useTranslation()
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    return (
        <div className="border">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-grey-900">{t("Employees")}</h3>
            </div>
            <div className="flex flex-row flex-wrap">
                {employees.filter(e => e.name !== "Casa").map(e =>
                    <EmployeeCard key={e.id} employee={e} isSelected={selectedEmployee?.id === e.id} onSelected={setSelectedEmployee} />
                )}
            </div>
            {selectedEmployee &&
                <EmployeeSalarySummary year={year} month={month}
                    employee={selectedEmployee}
                    holidays={holidays} vacations={vacations[selectedEmployee.id]}
                    recites={recites[selectedEmployee.id]}
                />}
        </div>
    )
}


type EmployeeSalarySummaryProps = {
    year: number
    month: number
    employee: Employee
    holidays: Record<string, PublicHoliday>
    vacations: (string | null)[]
    recites: number[]
}

export const EmployeeSalarySummary: React.FC<EmployeeSalarySummaryProps> = ({ year, month, employee, holidays, vacations, recites }) => {
    const { t } = useTranslation()
    const { baseSalary, commissionPercent, thresholdForCommission, tax, taxedPercent } = employee

    const total = recites.reduce((acc, cur) => acc + cur)
    const afterTaxes = total * taxedPercent * (1.0 - tax) + total * (1.0 - taxedPercent)
    const commission = Math.max(afterTaxes - thresholdForCommission, 0.0) * commissionPercent
    const daysInMonth = new Date(year, month, 0).getDate()

    const weekendDays = dateRangeArray(new Date(year, month - 1, 1)).filter(isWeekend).length
    const numberOfHolidays = Object.keys(holidays).length
    const numberOfVacationDays = vacations.filter(v => v !== null).length
    console.log({ daysInMonth, weekendDays, numberOfHolidays, numberOfVacationDays })
    const workedDays = Math.max(daysInMonth - weekendDays - numberOfHolidays - numberOfVacationDays, 0)
    const mealAllowance = 4.77 * workedDays
    // yeah.. wacky math
    const paycheck = calcPaycheck(employee, total)
    const paycheckColor = paycheck > total ? "text-red-600" : "text-gray-900"

    return (
        <div className="border-t border-gray-200">
            <EmployeeSummaryRecites year={year} month={month} employee={employee} recites={recites} />
            <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.name")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.base_salary")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(baseSalary, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.billed_after_tax")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(afterTaxes, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.commission", { commission: (commissionPercent * 100).toFixed(0) })}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(commission, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.meal_allowance", { workedDays })}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(mealAllowance, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.total")}</dt>
                    <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2`}>
                        <span className={`${paycheckColor}`}>{round(paycheck, 2)}&nbsp;€</span>
                    </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.bank_transfer")}</dt>
                    <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2`}>{round(Math.min(baseSalary + mealAllowance, commission), 2)}&nbsp;€</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.in_cash")}</dt>
                    <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2`}>{round(Math.max(paycheck - (baseSalary + mealAllowance), 0), 2)}&nbsp;€</dd>
                </div>

            </dl>
        </div>
    )
}

type EmployeeSummaryRecitesProps = {
    year: number
    month: number
    employee: Employee
    recites: number[]
}

const EmployeeSummaryRecites: React.FC<EmployeeSummaryRecitesProps> = ({ year, month, employee, recites }) => {
    const start = useMemo(() => new Date(Date.UTC(year, month - 1)), [year, month])
    const daysInMonth = new Date(year, month, 0).getDate()

    return (
        <div className="overflow-y-auto">
            <table className="mt-4">
                <thead>
                    <tr>
                        <th></th>
                        {[...Array<number>(daysInMonth)].map((_, i) => {
                            const current = new Date(start)
                            current.setDate(current.getDate() + i)
                            return <th key={i} className="border px-2 py-1 text-center font-medium text-gray-500 vertical-rl rotate-180">{current.toJSON().substring(0, 10)}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border px-1 py-2 text-center font-medium text-gray-500">
                            {employee.name}
                        </td>
                        {[...Array<number>(daysInMonth)].map((_, i) => {
                            const recite = recites[i]
                            return <td key={i} className="border px-2 py-1 text-center font-medium text-gray-500 vertical-rl rotate-180">{recite}&nbsp;€</td>
                        })}
                        <td className="border px-3 py-1 text-right">{recites.reduce((acc, cur) => acc + cur, 0.0).toFixed(2)}&nbsp;€</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

type EmployeeCardProps = {
    employee: Employee
    isSelected: boolean
    onSelected: (employee: Employee | null) => void
}
const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, isSelected, onSelected }) => {
    const { t } = useTranslation()
    return (
        <div className="flex-1 max-w-sm m-4 rounded-lg border border-gray-200 shadow-md">
            <div className="flex flex-col items-center py-5">
                <img className="mb-3 w-24 h-24 rounded-full shadow-lg" src={`/image/${employee.name.toLowerCase()}.webp`} alt={employee.name} />
                <h5 className="mb-1 text-xl font-medium text-grey-900">{employee.name}</h5>
                <span className="text-sm text-gray-500">{t(employee.title)}</span>
                <div className="flex mt-4 space-x-3">
                    <button type="button" className="inline-flex items-center px-4 py-2 font-medium text-center text-white bg-blue-700 rounded-lg" onClick={e => onSelected(isSelected ? null : employee)}>{t(isSelected ? "Close" : "Select")}</button>
                </div>
            </div>
        </div>
    )
}
