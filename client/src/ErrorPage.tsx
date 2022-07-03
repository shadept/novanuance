import { useTranslation } from "react-i18next"

type ErrorPageProps = {
    error: Error
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
    const { t } = useTranslation()
    return (
        <div className="bg-white m-auto p-20 text-center rounded-lg shadow-lg">
            <img className="inline" src="/error.png" alt="error image" />
            <div className="text-gray-500 text-6xl tracking-widest">{t("Oops... something went wrong")}</div>
            <div className="text-gray-500 text-xl mt-4">{t("Please reload and try again")}</div>
            <div className="text-gray-300 text-s mt-20">{t("Details")}:<br/>{error.message}</div>
        </div>
    )
}
