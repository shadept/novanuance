export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {children}
        </div>
    )
}
