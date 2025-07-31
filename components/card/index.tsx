import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Resumen {
    title: string,
    value: any,
    subText?: any,
    icon: ReactNode,
    children?: ReactNode
}

export default function Card(props: Resumen) {
    return (
        <motion.div whileHover={{ scale: 1.02 }} className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden shadow rounded-lg">
            <article className="p-5">
                <div className="flex items-center">
                    <label className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        {props.icon}
                    </label>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 truncate">{props.title}</dt>
                            <dd className="flex items-baseline">
                                <div className="text-xl text-pretty font-semibold text-gray-900 dark:text-white">{props.value}</div>
                                <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                    <span>{props.subText}</span>
                                </div>
                            </dd>
                        </dl>
                    </div>
                    {props.children && (
                        <div className="ml-5 flex-shrink-0 border-t-2 border-gray-200 dark:border-zinc-700 pt-2">
                            {props.children}
                        </div>
                    )}
                </div>
            </article>
        </motion.div>
    )
}