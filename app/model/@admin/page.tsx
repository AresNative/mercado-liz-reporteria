import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { HistoryIcon, ArrowRightIcon } from "lucide-react";

export default function Admin() {
    return <>
        <BentoGrid>
            {/* Sección Nuestra Historia */}
            <BentoItem
                rowSpan={3}
                colSpan={2}
                title="Nuestra historia"
                className="px-0 pl-4"
                description="Conoce como empezó nuestra historia y como hemos crecido..."
                icon={<HistoryIcon className="h-6 w-6 text-primary" />}
            >
                <div className="relative h-[32vh]">
                    <div className="float-right -right-4 h-[30vh] md:w-[70%] rounded-s-full inset-0 bg-[#f2f2f7]">
                        <img src="/historia.png" className="h-full w-full object-cover rounded-s-lg shadow-md" />
                    </div>
                    <a href="/historia" className="absolute bottom-0 m-4 inline-flex items-center text-purple-600">
                        Ver más <ArrowRightIcon />
                    </a>
                </div>
            </BentoItem>
        </BentoGrid>
    </>;
}