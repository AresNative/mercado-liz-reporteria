import { InputFormProps } from "@/utils/types/interfaces";
import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export function LinkForm({ cuestion }: InputFormProps) {
    const { label, href } = cuestion;
    return (
        <Link
            href={href ?? ""}
            className="flex gap-2 items-center w-full text-violet-600 underline">
            <LinkIcon className="size-4" /> {label}
        </Link>
    );
}