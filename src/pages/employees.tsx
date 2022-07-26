import { GetServerSideProps } from "next"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { dateRangeArray, isEqual, isWeekend } from "../lib/date"
import { Employee, Receipt, useEmployees, useHolidays, useReceipts, useVacations } from "../lib/hooks"
import { round } from "../lib/math"
import { Holiday } from "../server/router/holiday"
import Image from "next/future/image"


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

type EmployeeSummaryListProps = {
    year: number,
    month: number,
}

const EmployeeSummaryList: React.FC<EmployeeSummaryListProps> = ({ year, month }) => {
    const { t } = useTranslation()
    const employees = useEmployees()
    const holidays = useHolidays(year)

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined)

    if (employees.data === undefined || holidays.data === undefined) {
        return <div>Loading...</div>
    }

    return (
        <div >
            {/* <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-grey-900">{t("Employees")}</h3>
            </div> */}
            <div className="flex flex-row flex-wrap">
                {employees.data.filter(e => e.name !== "Casa").map(e =>
                    <EmployeeCard key={e.id} employee={e} isSelected={selectedEmployee?.id === e.id} onSelected={setSelectedEmployee} />
                )}
            </div>
            {selectedEmployee &&
                <EmployeeSalarySummary year={year} month={month}
                    employee={selectedEmployee} holidays={holidays.data}
                />}
        </div>
    )
}

type EmployeeCardProps = {
    employee: Employee
    isSelected: boolean
    onSelected: (employee: Employee | undefined) => void
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, isSelected, onSelected }) => {
    const { t } = useTranslation()
    return (
        <div className="flex-1 max-w-sm m-4 rounded-lg border border-gray-200 shadow-md">
            <div className="flex flex-col items-center py-5">
                <Image className=" mb-3 w-24 h-24 rounded-full shadow-lg" src={`/image/${employee.name.toLowerCase()}.webp`} alt={employee.name} />
                <h5 className="mb-1 text-xl font-medium text-grey-900">{employee.name}</h5>
                <span className="text-sm text-gray-500">{t(employee.title)}</span>
                <div className="flex mt-4 space-x-3">
                    <button type="button" className="inline-flex items-center px-4 py-2 font-medium text-center text-white bg-blue-700 rounded-lg" onClick={e => onSelected(isSelected ? undefined : employee)}>
                        {t(isSelected ? "Close" : "Select")}
                    </button>
                </div>
            </div>
        </div>
    )
}


type EmployeeSalarySummaryProps = {
    year: number
    month: number
    employee: Employee
    holidays: Holiday[]
}

export const EmployeeSalarySummary: React.FC<EmployeeSalarySummaryProps> = ({ year, month, employee, holidays }) => {
    const { t } = useTranslation()
    const receipts = useReceipts(year, month, employee.id)
    const vacations = useVacations(year, month, employee.id)

    const salary = useMemo(() => {
        if (receipts.data === undefined || vacations.data === undefined) return undefined

        const { baseSalary, commissionPercent, thresholdForCommission, taxRate } = employee

        const receiptsTotal = receipts.data.map(r => r.amount).reduce((acc, cur) => acc + cur, 0.0)
        const afterTaxes = receiptsTotal - receiptsTotal * taxRate
        const commission = Math.max(afterTaxes - thresholdForCommission, 0.0) * commissionPercent
        const daysInMonth = new Date(year, month, 0).getDate()

        const weekendDays = dateRangeArray(new Date(year, month - 1, 1)).filter(isWeekend).length
        const numberOfHolidays = holidays.filter(h => h.date.getFullYear() == year && h.date.getMonth() == month - 1).length
        const numberOfVacationDays = vacations.data.length
        console.log({ daysInMonth, weekendDays, numberOfHolidays, numberOfVacationDays })
        const workedDays = Math.max(daysInMonth - weekendDays - numberOfHolidays - numberOfVacationDays, 0)
        const mealAllowance = 4.77 * workedDays
        // yeah.. wacky math
        const paycheck = baseSalary + commission

        const backTransfer = Math.min(baseSalary + mealAllowance, commission)
        const inCash = Math.max(paycheck - (baseSalary + mealAllowance), 0)

        return {
            baseSalary,
            receiptsTotal,
            taxRate,
            afterTaxes,
            commissionPercent,
            commission,
            workedDays,
            mealAllowance,
            paycheck,
            backTransfer,
            inCash
        }
    }, [employee, holidays, receipts.data, vacations.data, year, month])

    if (salary === undefined || receipts.data === undefined || vacations.data === undefined) {
        return <div>Loading...</div>
    }

    const paycheckColor = salary.paycheck > salary.receiptsTotal ? "text-red-600" : "text-gray-900"

    return (
        <div className="border-t border-gray-200">
            <EmployeeSummaryRecites year={year} month={month} employee={employee} receipts={receipts.data} />
            <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.name")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.base_salary")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(salary.baseSalary, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.billed_after_tax")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(salary.afterTaxes, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.commission", { commission: (salary.commissionPercent * 100).toFixed(0) })}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(salary.commission, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.meal_allowance", { workedDays: salary.workedDays })}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(salary.mealAllowance, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.total")}</dt>
                    <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2`}>
                        <span className={`${paycheckColor}`}>{round(salary.paycheck, 2)}&nbsp;€</span>
                    </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.bank_transfer")}</dt>
                    <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2`}>{round(salary.backTransfer, 2)}&nbsp;€</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.in_cash")}</dt>
                    <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2`}>{round(salary.inCash, 2)}&nbsp;€</dd>
                </div>

            </dl>
        </div>
    )
}

type EmployeeSummaryRecitesProps = {
    year: number
    month: number
    employee: Employee
    receipts: Receipt[]
}

const EmployeeSummaryRecites: React.FC<EmployeeSummaryRecitesProps> = ({ year, month, employee, receipts }) => {
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
                            return <th key={i} className="border px-1 py-2 text-center font-medium text-gray-500 vertical-rl">{current.toJSON().substring(0, 10)}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border px-1 py-2 text-center font-medium text-gray-500">
                            {employee.name}
                        </td>
                        {Array.from(Array(daysInMonth)).map((_, i) => {
                            const current = new Date(start)
                            current.setDate(start.getDate() + i)
                            const receipt = receipts.find(r => isEqual(r.date, current))
                            return (
                                <td key={i} className="border px-1 py-2 text-center text-gray-500 vertical-rl">
                                    {receipt !== undefined ? receipt.amount.toFixed(2) + " €" : "-"}
                                </td>
                            )
                        })}
                        <td className="border px-3 py-1 text-right">{receipts.reduce((acc, cur) => acc + cur.amount, 0.0).toFixed(2)}&nbsp;€</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default EmployeeSummaryList
