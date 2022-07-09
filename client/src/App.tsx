import { useMemo, useRef, useState } from 'react';
import { ReciteCalendar } from './components/ReciteCalendar';
import { EmployeeRecite } from './model/EmployeeRecite';
import { fetchEmployees, fetchHolidays, fetchRecites, fetchVacations, postRecite, postVacation } from './api';
import { useMutation, useQuery, UseQueryResult } from 'react-query';
import { queryClient } from '.';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ErrorPage } from './ErrorPage';
import Select from 'react-select';
import { EmployeeSummaryList } from './components/EmployeeSummary';
import { Tab, Tabs } from './components/Tabs';
import { Vacation } from './model/Vacation';
import { VacationsCalendar } from './components/VacationCalendar';
import { Employee } from './model/Employee';
import { useRouter } from './hooks';


const today = new Date()

const useEmployeesQuery = () => useQuery('employees', fetchEmployees);

const useHolidaysQuery = (year: number, month: number) => useQuery(['holidays', year, month], () => fetchHolidays(year, month))

const useRecitesQuery = (year: number, month: number, employeesQuery: UseQueryResult<Employee[], unknown>) => {
    const { t } = useTranslation()
    const recitesQuery = useQuery(['recites', year, month], async () => {
        const recites = await fetchRecites(year, month)
        const result = {} as Record<string, number[]>
        if (!employeesQuery.isSuccess) return result
        for (const e of employeesQuery.data) {
            const values = Array<number>(31).fill(0)
            recites.filter(r => r.employeeId === e.id)
                .forEach(r => values[r.date.getDate() - 1] = r.value)
            result[e.id] = values
        }
        return result
    }, {
        enabled: employeesQuery.isSuccess
    })
    const reciteToastId = useRef<number | string | null>(null)
    const { mutate: mutateRecite } = useMutation(postRecite, {
        onSuccess: () => {
            if (reciteToastId.current) toast.dismiss(reciteToastId.current)
            reciteToastId.current = toast.success(t("Recite updated"))
            queryClient.invalidateQueries('recites')
        },
        onError: (error: Error) => { toast.error("Failed to update recite: " + error.message) }
    })
    return { recitesQuery, mutateRecite }
}

const useVacationsQuery = (year: number, month: number, employeesQuery: UseQueryResult<Employee[], unknown>) => {
    const { t } = useTranslation()
    const vacationQuery = useQuery(['vacations', year, month], async () => {
        const vacations = await fetchVacations(year, month)
        const result = {} as Record<string, (string | null)[]>
        if (!employeesQuery.isSuccess) return result
        for (const e of employeesQuery.data) {
            const values = Array<string | null>(31).fill(null)
            vacations.filter(v => v.employeeId === e.id)
                .forEach(v => values[v.date.getDate() - 1] = v.id)
            result[e.id] = values
        }
        return result
    }, {
        enabled: employeesQuery.isSuccess
    })
    const vacationToastId = useRef<number | string | null>(null)
    const { mutate: mutateVacation } = useMutation(postVacation, {
        onMutate: async (newVacation) => {
            await queryClient.cancelQueries("vacations")
            const previousValue = queryClient.getQueryData<Record<string, (string | null)[]>>("vacations")
            queryClient.setQueryData("vacations", (old: typeof previousValue) => ({
                ...old,
                [newVacation.date.getDate() - 1]: newVacation.id
            }))
            return previousValue
        },
        onSuccess: (result, variables, context) => {
            if (vacationToastId.current) toast.dismiss(vacationToastId.current)
            vacationToastId.current = toast.success(t("Vacation updated"))
            queryClient.invalidateQueries('vacations')
        },
        onError: (error: Error, variables, previousValue) => {
            toast.error("Failed to update vacation: " + error.message)
            queryClient.setQueryData("vacations", previousValue)
        }
    })
    return { vacationQuery, mutateVacation }
}

type Param = {
    year: number
    month: number
    tab: number
}


export const App: React.FC = () => {
    const { t, i18n } = useTranslation()
    const router = useRouter()
    // @ts-ignore
    const { year = today.getFullYear(), month = today.getMonth() + 1, tab = 0 }: Param = router.query
    //! TODO: validate querystring

    const setYear = (year: number) => router.push("/", { year, month, tab })
    const setMonth = (month: number) => router.push("/", { year, month, tab })
    const setTab = (tab: number) => router.push("/", { year, month, tab })

    const handleTabClick = useCallback((index: number) => {
        setTab(index)
    }, [])

    const employeesQuery = useEmployeesQuery()
    const holidaysQuery = useHolidaysQuery(year, month)
    const { recitesQuery, mutateRecite } = useRecitesQuery(year, month, employeesQuery)
    const handleReciteChange = useCallback((recite: EmployeeRecite) => {
        console.log("Setting recite", recite)
        mutateRecite(recite)
    }, [mutateRecite])


    const { vacationQuery, mutateVacation } = useVacationsQuery(year, month, employeesQuery)
    const handleVacationChange = useCallback((vacation: Vacation) => {
        console.log("Setting vacation", vacation)
        mutateVacation(vacation)
    }, [mutateVacation])

    const yearOptions = useMemo(() => {
        return [...Array(today.getFullYear() - 2020 + 1)]
            .map((_, i) => 2020 + i)
            .map(year => ({ label: year, value: year }))
    }, [today])

    const monthOptions = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(i18n.language, { month: 'long' })
        return [...Array(12)]
            .map((_, i) => formatter.format(new Date(year, i, 1)))
            .map((l, i) => ({ label: capitalize(l), value: i + 1 }))
    }, [year])

    if (employeesQuery.error instanceof Error) {
        return (<ErrorPage error={employeesQuery.error} />)
    }

    if (employeesQuery.isSuccess && recitesQuery.isSuccess && holidaysQuery.isSuccess && vacationQuery.isSuccess) {
        return (
            <div className=" bg-gray-100">
                <div className="container bg-white mx-auto px-4">
                    <Header />
                    <div className="flex gap-4 my-4">
                        <div className="flex-1">
                            <label className="ml-2">{t("Year")}:</label>
                            <Select options={yearOptions} value={{ label: year, value: year }} onChange={e => e && setYear(e.value)} />
                        </div>
                        <div className="flex-1">
                            <label className="ml-2">{t("Month")}</label>
                            <Select options={monthOptions} value={monthOptions[month - 1]} onChange={e => e && setMonth(e.value)} />
                        </div>
                    </div>
                    <Tabs activeTab={tab} onChange={handleTabClick}>
                        <Tab title={t("Recites")} icon="fas fa-receipt">
                            <ReciteCalendar
                                year={year}
                                month={month}
                                holidays={holidaysQuery.data}
                                employees={employeesQuery.data}
                                vacations={vacationQuery.data}
                                recites={recitesQuery.data}
                                onReciteChange={handleReciteChange}
                            />
                        </Tab>
                        <Tab title={t("Vacations")} icon="fas fa-plane-departure">
                            <VacationsCalendar
                                year={year}
                                month={month}
                                vacations={vacationQuery.data}
                                holidays={holidaysQuery.data}
                                employees={employeesQuery.data.filter(e => e.title !== "owner")}
                                onVacationChange={handleVacationChange}
                            />
                        </Tab>
                        <Tab title={t("Employees")} icon="fas fa-user-group">
                            <EmployeeSummaryList
                                year={year}
                                month={month}
                                employees={employeesQuery.data}
                                holidays={holidaysQuery.data}
                                vacations={vacationQuery.data}
                                recites={recitesQuery.data}
                            />
                        </Tab>
                    </Tabs>
                    <Footer />
                </div>
            </div>
        );
    }

    return (
        <div className="m-auto">
            <div className="m-8 w-16 h-16 border-4 spinner-border rounded-full animate-spin"></div>
            <div className="text-center">{t("Loading")}</div>
        </div>
    )
}

const capitalize = (text: string, locale: string = navigator.language) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)

const Header = () => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900">Nova Nuance</h2>
                <div></div>
            </div>
            <div></div>
        </div>
    )
}

const Footer = () => {
    return (
        <div className="py-3 text-right">
            {/* @ts-ignore */}
            Version: {window.version}
        </div>
    )
}
