import { colorClasses } from "@/utils/constants/colors";

interface BadgeProps {
    color: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'indigo' | 'pink' | 'gray' | 'black' | 'white';
    text: string;
}

export default function Badge(props: BadgeProps) {
    const { color, text } = props;
    const styles = colorClasses[color];

    return (
        <span
            className={`inline-flex items-center rounded-md ${styles.bg} px-2 py-1 text-xs font-medium ${styles.text} ring-1 ring-inset ${styles.ring}`}
        >
            {text}
        </span>
    );
}
