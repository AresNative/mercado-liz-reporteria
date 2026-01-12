interface Avatar {
    alt: string;
    src: string;
}
interface Group {
    data: Avatar[];
    size: ""
}
export default function AvatarGroup(props: Group) {
    const { data } = props;
    return (
        <div className="flex -space-x-2 overflow-hidden">
            {data.map((rows: any, key: any) => (
                <img
                    key={key}
                    alt={rows.alt}
                    src={rows.src}
                    className="inline-block size-8 rounded-full ring-2 ring-white"
                />))}
        </div>
    )
}
