import Head from "next/head"

export const Header = () => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <Head>
                    <title>Nova Nuance</title>
                </Head>
                <h2 className="text-2xl font-bold leading-7 text-gray-900">Nova Nuance</h2>
                <div></div>
            </div>
            <div></div>
        </div>
    )
}
