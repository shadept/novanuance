import classnames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import i18n from "../lib/i18n";
import { Footer } from "./footer";
import { Header } from "./header";

const capitalize = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)


export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation()
    const today = useMemo(() => new Date(), [])

    const router = useRouter()
    let { year = today.getFullYear(), month = today.getMonth() + 1 } = router.query
    if (Array.isArray(year)) year = year[0] ?? today.getFullYear()
    if (Array.isArray(month)) month = month[0] ?? (today.getMonth() + 1)
    if (typeof year !== 'number') year = Number.parseInt(year)
    if (typeof month !== 'number') month = Number.parseInt(month)

    const yearOptions = useMemo(() => {
        return [...Array(today.getFullYear() - 2020 + 1)]
            .map((_, i) => 2020 + i)
            .map(year => ({ label: year, value: year }))
    }, [today])

    const monthOptions = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(i18n.language, { month: 'long' })
        return Array.from(Array(12))
            .map((_, i) => formatter.format(new Date(year as number, i, 1)))
            .map((l, i) => ({ label: capitalize(l, router.locale || "en-EN"), value: i + 1 }))
    }, [year, router.locale])

    const setYear = (year: number) => router.push("/", { query: { year, month } })
    const setMonth = (month: number) => router.push("/", { query: { year, month } })

    const style = (isActive: boolean) => classnames("group inline-flex p-4 rounded-t-lg border-b-2", {
        "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300": !isActive,
        "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 active": isActive
    })
    const iconStyle = (isActive: boolean) => classnames("mr-2 leading-6", {
        "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300": !isActive,
        "text-blue-600 dark:text-blue-500": isActive
    })

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
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
                <ul className="flex">
                    <li className="mr-2">
                        <Link href={{ pathname: "/receipts", query: router.query }} >
                            <a className={style(router.pathname == "/receipts")}>
                                <i className={classnames("fas fa-receipt", iconStyle(router.pathname == "/receipts"))}></i>
                                {t("Recites")}
                            </a>
                        </Link>
                    </li>
                    <li className="mr-2">
                        <Link href={{ pathname: "/vacations", query: router.query }} >
                            <a className={style(router.pathname == "/vacations")}>
                                <i className={classnames("fas fa-plane-departure", iconStyle(router.pathname == "/vacations"))}></i>
                                {t("Vacations")}
                            </a>
                        </Link>
                    </li>
                    <li className="mr-2">
                        <Link href={{ pathname: "/employees", query: router.query }} >
                            <a className={style(router.pathname == "/employees")}>
                                <i className={classnames("fas fa-user-group", iconStyle(router.pathname == "/employees"))}></i>
                                {t("Employees")}
                            </a>
                        </Link>
                    </li>
                    <li className="mr-2">
                        <Link href={{ pathname: "/inventory", query: router.query }} >
                            <a className={style(router.pathname == "/inventory")}>
                                <i className={classnames("fas fa-warehouse", iconStyle(router.pathname == "/inventory"))}></i>
                                {t("Inventory")}
                            </a>
                        </Link>
                    </li>
                </ul>
                {children}
                <Footer />
            </div>
            <ToastContainer />
        </div>
    )
}
