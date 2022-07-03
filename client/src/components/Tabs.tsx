import classnames from "classnames"
import React from "react"

export type TabsProps = {
    activeTab: number
    onChange: (newActiveTab: number) => void
    children: readonly React.ReactElement<TabProps, typeof Tab>[]
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onChange, children }) => {
    return (
        <div>
            {/* TABS */}
            <ul className="flex">
                {React.Children.map(children, ({ key, props }, index) => {
                    const isActive = index === activeTab
                    const style = classnames("group inline-flex p-4 rounded-t-lg border-b-2", {
                        "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300": !isActive,
                        "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 active": isActive
                    })
                    const iconStyle = classnames("mr-2 leading-6", {
                        "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300": !isActive,
                        "text-blue-600 dark:text-blue-500": isActive
                    })
                    return (
                        <li key={key} className="mr-2">
                            <a href="#" className={style} onClick={e => onChange(index)}>
                                {props.icon && <i className={classnames(props.icon, iconStyle)}></i>}
                                {props.title}
                            </a>
                        </li>
                    )
                })}
            </ul>
            {/* TAB CONTENT */}
            {React.Children.map(children, (child, index) => {
                return index === activeTab ? child : null
            })}
        </div>
    )
}

export type TabProps = {
    icon?: string
    title: string
    children: React.ReactNode
}

export const Tab: React.FC<TabProps> = ({ children }) => {
    return (
        <div className="p-4">{children}</div>
    )
}
