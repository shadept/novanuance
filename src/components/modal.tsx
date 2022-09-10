import classNames from "classnames"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "./button"

export type ModalProps = {
    title: string
    onClose?: () => void
    children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
    return (
        <>
            <div className="fixed flex items-center justify-center overflow-x-hidden overflow-y-auto inset-0 z-50 outline-none focus:outline-none">
                <div className="relative w-auto my-6 mx-auto max-w-4xl">
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200">
                            <h3 className="text-3xl font-semibold">
                                {title}
                            </h3>
                            <div className="text-lg my-auto px-2 cursor-pointer" onClick={onClose}>
                                <i className="fa-solid fa-xmark"></i>
                            </div>
                        </div>
                        {/* Content */}
                        <div className="relative p-6 flex-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
    )
}


export type RemovePromptModalProps = {
    title: string
    prompt: ReactNode
    preferredChoice?: 'yes' | 'no'
    onYes: () => void,
    onNo?: () => void,
}

const preferredStyle = "bg-blue-500 hover:bg-blue-700"
const notPreferredStyle = "bg-red-500 hover:bg-red-700"

export const RemovePromptModal: React.FC<RemovePromptModalProps> = ({ title, prompt: description, preferredChoice, onYes, onNo }) => {
    const { t } = useTranslation()

    const styles = [
        (preferredChoice ?? 'yes') === 'yes' ? preferredStyle : notPreferredStyle,
        preferredChoice === 'no' ? preferredStyle : notPreferredStyle
    ]

    return (
        <Modal title={title} onClose={onNo}>
            <p className="text-lg mb-4">{description}</p>
            <div className="flex justify-center gap-4">
                <Button className={classNames("px-4 border-none text-lg text-white", styles[0])} onClick={onYes}>{t("yes_remove")}</Button>
                <Button className={classNames("px-4 border-none text-lg text-white", styles[1])} onClick={onNo}>{t("no_remove")}</Button>
            </div>
        </Modal>
    )
}
