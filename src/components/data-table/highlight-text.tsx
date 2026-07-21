interface HighlightTextProps {
    text: string
    highlight: string
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function HighlightText({ text, highlight }: HighlightTextProps) {
    const query = highlight.trim()

    if (!query) return <>{text}</>

    const matcher = new RegExp(`(${escapeRegExp(query)})`, "gi")
    const parts = text.split(matcher)

    return (
        <span>
            {parts.map((part, index) =>
                part.toLocaleLowerCase() === query.toLocaleLowerCase() ? (
                    <mark
                        key={`${part}-${index}`}
                        className="rounded-sm bg-yellow-200 px-0.5 font-bold text-slate-900"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    )
}
