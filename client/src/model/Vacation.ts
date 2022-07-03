import { EmployeeId } from "./Employee";

export interface Vacation {
    id: string | null
    employeeId: EmployeeId;
    date: Date;
    isOnVacation: boolean;
}
