
import queryString, { ParsedQuery } from "query-string"
import { useEffect, useMemo, useState } from "react";

const getCurrentLocation = () => {
    const { pathname, search } = window.location;
    const query = queryString.parse(search, { parseBooleans: true, parseNumbers: true });
    return { pathname, query };
}

const routerListener = [] as (() => void)[]
function routerNotify() { routerListener.forEach(listener => listener()) }

export interface Router {
    push(path: string, query?: any): void;
    replace(path: string, query?: any): void;
    pathname: string
    query: ParsedQuery
}

export function useRouter() {
    const [{ pathname, query }, setLocation] = useState(getCurrentLocation());

    useEffect(() => {
        window.addEventListener("popstate", handleChange)
        return () => { window.removeEventListener("popstate", handleChange) }
    }, [])

    useEffect(() => {
        routerListener.push(handleChange)
        return () => { routerListener.splice(routerListener.indexOf(handleChange), 1) }
    }, [])

    const handleChange = () => setLocation(getCurrentLocation())

    // Memoize so that a new object is only returned if something changes
    return useMemo(() => ({
        push: (path: string, query?: any) => {
            const newQuery = queryString.stringify(query)
            window.history.pushState(null, '', `${path}?${newQuery}`)
            routerNotify()
        },
        replace: (path: string, query?: any) => {
            const newQuery = queryString.stringify(query)
            window.history.replaceState(null, '', `${path}?${newQuery}`)
            routerNotify()
        },
        pathname,
        query,
    }), [pathname, query]);
}
