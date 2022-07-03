export const tuple = <T extends unknown[]>(...args: T) => args;

export const delay = async (ms: number) => new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms)
})
