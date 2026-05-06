export default function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-xl font-bold border-l-4 border-emerald-500 pl-3 mb-5 text-gray-900">
            {children}
        </div>
    )
}
