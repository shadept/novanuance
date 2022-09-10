import classNames from "classnames"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"


export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

export const Button: React.FC<ButtonProps> = ({ children, className, ...rest }) => {
    return (
        <button type="button" className={classNames("relative inline-flex items-center p-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 disabled:bg-gray-300 hover:bg-gray-50", className)} {...rest}>
            {children}
        </button>
    )
}
