

export const round = (number: number, digits: number) => {
    const p = Math.pow(10, digits)
    return Math.round((number + Number.EPSILON) * p) / p
}
