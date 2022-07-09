import create, { GetState, SetState } from "zustand";
import { Employee } from "./model/Employee";
import { EmployeeRecite } from "./model/EmployeeRecite";
import { PublicHoliday } from "./model/PublicHoliday";

export type State = {
    holidays: Record<string, PublicHoliday>
    employees: Employee[]
    recites: EmployeeRecite[]
    setHolidays: (holidays: Record<string, PublicHoliday>) => void
    setEmployees: (employees: Employee[]) => void
    setRecites: (year: number, month: number, recites: EmployeeRecite[]) => void
}


export interface EmployeeState {
    employees: Employee[]
    loading: boolean
}

const employeesSlice = (set: SetState<EmployeeState>, get: GetState<EmployeeState>) => ({

})






export const useStore = create<State>(set => ({
    holidays: {},
    employees: [],
    recites: [],
    setHolidays: (holidays: Record<string, PublicHoliday>) => set({ holidays }),
    setEmployees: (employees: Employee[]) => set({ employees }),
    setRecites: (year: number, month: number, recites: EmployeeRecite[]) => {
        set(state => ({
            recites: [
                ...state.recites.filter(r => r.date.getFullYear() !== year && r.date.getMonth() !== (month - 1)),
                ...recites
            ]
        }))
    },
}))
