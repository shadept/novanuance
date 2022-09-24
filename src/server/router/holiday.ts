import { createRouter } from "./context";
import { z } from "zod";


export type Holiday = {
    date: Date
    localName: String
    name: String
}

type HolidayAPI = {
    date: string
    localName: String
    name: String
    // countryCode: string
    global: boolean
}

export const holidayRouter = createRouter()
    .query("byYear", {
        input: z.object({
            year: z.number(),
            countryCode: z.string().default("PT"),
        }),
        async resolve({ ctx, input }) {
            const url = `https://date.nager.at/api/v3/PublicHolidays/${input.year}/${input.countryCode}`
            let holidays = await fetch(url).then(r => r.json()) as HolidayAPI[]
            holidays = holidays.filter(h => h.global)
            if (input.countryCode === "PT") {
                holidays.push({ date: `${input.year}-06-13`, localName: "Dia de Santo António", name: "St. Anthony's Day", global: false })
            }
            const response = holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(h => ({ date: new Date(h.date), localName: h.localName, name: h.name }) as Holiday)

            return response
        },
    });
