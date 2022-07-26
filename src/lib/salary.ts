import { Employee } from "@prisma/client";
import { round } from "./math";


export const calcPaycheck = (employee: Employee, recitesTotal: number): number => {
    const baseSalary = employee.baseSalary.toNumber()
    const commissionPercent = employee.commissionPercent.toNumber()
    const thresholdForCommission = employee.thresholdForCommission.toNumber()
    const taxRate = employee.taxRate.toNumber()

    const afterTaxes = recitesTotal - (recitesTotal * taxRate)
    return round(baseSalary + Math.max(afterTaxes - thresholdForCommission, 0.0) * commissionPercent, 3)
}
