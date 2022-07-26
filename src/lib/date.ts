export const dateRange = (start: Date, end?: Date) => {
    if (end === undefined) {
        end = new Date(start.getTime())
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
    }

    return {
        [Symbol.iterator]: () => {
            let current = start
            return {
                next() {
                    const result = { value: current, done: current > end!! }
                    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
                    return result
                }
            }
        }
    }
}

export const dateRangeArray = (start: Date, end?: Date) => {
    return Array.from(dateRange(start, end))
}

export const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6
}

export const isEqual = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear()
        && date1.getMonth() === date2.getMonth()
        && date1.getDate() === date2.getDate()
}
