import i18n, { Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources: Resource = {
    en: {
        translation: {
            "Loading": "Loading...",
            "Year": "Year",
            "Month": "Month",
            "Sunday": "Sunday",
            "Monday": "Monday",
            "Tuesday": "Tuesday",
            "Wednesday": "Wednesday",
            "Thursday": "Thursday",
            "Friday": "Friday",
            "Saturday": "Saturday",
            "Recites": "Recites",
            "Employees": "Employees",
            "employee": {
                "name": "Name",
                "base_salary": "Base salary",
                "billed_after_tax": "Billed (fax TAX)",
                "commission": "Commission (Billed * {{commission}}%)",
                "total": "Total (base + commission)"
            },
            "Oops... something went wrong": "Oops... something went wrong",
            "Please reload and try again": "Please reload and try again",
            "Details": "Details",
            "Recite updated": "Recite updated",
            "Vacation updated": "Vacation updated",
            "hairdresser": "Hairdresser",
            "barber": "Barber",
            "manicurist": "Manicurist",
            "beautician": "Beautician",
            "Select": "Select",
            "Close": "Close",
            "Vacations": "Vacations",
        }
    },
    pt: {
        translation: {
            "Loading": "A carregar...",
            "Year": "Ano",
            "Month": "Mês",
            "Sunday": "Domingo",
            "Monday": "Segunda",
            "Tuesday": "Terça",
            "Wednesday": "Quarta",
            "Thursday": "Quinta",
            "Friday": "Sexta",
            "Saturday": "Sabado",
            "Recites": "Recibos",
            "Employees": "Empregados",
            "employee": {
                "name": "Nome",
                "base_salary": "Salário base",
                "billed_after_tax": "Faturado (após IVA)",
                "commission": "Comissão (faturado * {{commission}}%)",
                "total": "Total (base + comissão)"
            },
            "Oops... something went wrong": "Oops... algo correu mal",
            "Please reload and try again": "Por favor tenta outra vez",
            "Details": "Detalhes",
            "Recite updated": "Recibo atualizado",
            "Vacation updated": "Dia de férias atualizado",
            "hairdresser": "Cabeleireira",
            "barber": "Barbeiro",
            "manicurist": "Manicure",
            "beautician": "Esteticista",
            "Select": "Selecionar",
            "Close": "Fechar",
            "Vacations": "Férias",
        }
    }
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'pt',
        interpolation: {
            escapeValue: false
        }
    })


export default i18n
