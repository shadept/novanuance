export interface Employee {
    id: string;
    name: string
    title: string
    baseSalary: number
    commissionPercent: number
    thresholdForCommission: number
    tax: number
    taxedPercent: number
}

export type EmployeeId = Employee['id'];

export const calcPaycheck = (employee: Employee, recitesTotal: number): number => {
    const { baseSalary, commissionPercent, thresholdForCommission, tax, taxedPercent } = employee
    const afterTaxes = recitesTotal * taxedPercent * (1.0 - tax) + recitesTotal * (1.0 - taxedPercent)
    return round(baseSalary + Math.max(afterTaxes - thresholdForCommission, 0.0) * commissionPercent, 3)
}

export const round = (number: number, digits: number) => {
    const p = Math.pow(10, digits)
    return Math.round((number + Number.EPSILON) * p) / p
}
