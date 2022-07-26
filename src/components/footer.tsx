import pak from "../../package.json";

export const Footer = () => {
    return (
        <div className="py-3 text-right">
            {/* @ts-ignore */}
            Version: {pak.version}
        </div>
    )
}
