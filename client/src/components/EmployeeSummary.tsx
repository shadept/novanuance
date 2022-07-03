import { useState } from "react"
import { useTranslation } from "react-i18next"
import { calcPaycheck, Employee, round } from "../model/Employee"

export type EmployeeSummaryListProps = {
    employees: Employee[]
    recites: Record<string, number[]>
}

export const EmployeeSummaryList: React.FC<EmployeeSummaryListProps> = ({ employees, recites }) => {
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
            {selectedEmployee && <EmployeeSalarySummary employee={selectedEmployee} recites={recites[selectedEmployee.id]} />}
        </div>
    )
}


type EmployeeSalarySummaryProps = {
    employee: Employee
    recites: number[]
}

export const EmployeeSalarySummary: React.FC<EmployeeSalarySummaryProps> = ({ employee, recites }) => {
    const { t } = useTranslation()
    const { baseSalary, commissionPercent, thresholdForCommission, tax, taxedPercent } = employee

    const total = recites.reduce((acc, cur) => acc + cur)
    const afterTaxes = total * taxedPercent * (1.0 - tax) + total * (1.0 - taxedPercent)
    const paycheck = calcPaycheck(employee, total)
    const paycheckColor = paycheck > total ? "text-red-600" : "text-gray-900"

    return (
        <div className="border-t border-gray-200">
            <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.name")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.name}</dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.base_salary")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(baseSalary, 2)} €</dd>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.billed_after_tax")}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(afterTaxes, 2)} €</dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.commission", { commission: (commissionPercent * 100).toFixed(0) })}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{round(Math.max(afterTaxes - thresholdForCommission, 0.0) * commissionPercent, 2)} €</dd>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">{t("employee.total")}</dt>
                    <dd className={`mt-1 text-sm ${paycheckColor} sm:mt-0 sm:col-span-2`}>{round(paycheck, 2)} €</dd>
                </div>
            </dl>
        </div>
    )
}

type EmployeeCard = {
    employee: Employee
    isSelected: boolean
    onSelected: (employee: Employee | null) => void
}
const EmployeeCard: React.FC<EmployeeCard> = ({ employee, isSelected, onSelected }) => {
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
