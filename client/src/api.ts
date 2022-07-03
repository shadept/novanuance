import { Employee } from "./model/Employee"
import { EmployeeRecite } from "./model/EmployeeRecite"
import { PublicHoliday } from "./model/PublicHoliday"
import { Vacation } from "./model/Vacation"


export const fetchHolidays = async (year: number, countryCode: string = "PT") => {
    const response = await fetch(`/holidays/${year}/${countryCode}`)
    const holidays = await response.json() as PublicHoliday[]
    return holidays.reduce((acc, curr) => (acc[curr.date] = curr, acc), {} as Record<string, PublicHoliday>)
}

export const fetchEmployees = async () => {
    type EmployeeDto = Omit<Employee, 'id'> & { _id: string }
    const response = await fetch("/employee")
    const result = await response.json() as Employee[]
    return result
}

export const fetchRecites = async (year: number, month: number) => {
    type ReciteDto = Omit<EmployeeRecite, 'date'> & { date: string }
    const response = await fetch(`/recite/${year}/${month}`)
    const result = await response.json() as ReciteDto[]
    return result.map(dto => ({ ...dto, date: new Date(dto.date) })) as EmployeeRecite[]
}

export const postRecite = async (recite: EmployeeRecite) => {
    await fetch(`/recite`, {
        method: 'POST',
        headers: { 'Content-Type': ' application/json' },
        body: JSON.stringify(recite)
    })
}

export const fetchVacations = async (year: number, month: number) => {
    const response = await fetch(`/vacation/${year}/${month}`)
    const result = await response.json() as Vacation[]
    return result.map(dto => ({ ...dto, date: new Date(dto.date) })) as Vacation[]
}

export const postVacation = async (vacation: Vacation) => {
    if (vacation.isOnVacation) {
        await fetch(`/vacation`, {
            method: 'POST',
            headers: { 'Content-Type': ' application/json' },
            body: JSON.stringify({ ...vacation, isOnVacation: undefined })
        })
    } else {
        await fetch(`/vacation/${vacation.id}`, { method: 'DELETE' })
    }
}
