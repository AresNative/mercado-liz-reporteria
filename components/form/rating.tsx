import { cn } from "@/utils/functions/cn";
import { StarRatingProps } from "@/utils/types/interfaces";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

export function Rating(props: StarRatingProps) {
    const { cuestion } = props;
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    useEffect(() => {
        if (cuestion.valueDefined) {
            props.setValue(cuestion.name, cuestion.valueDefined);
        }
    }, [cuestion.valueDefined]);

    const handleRating = (value: number) => {
        setRating(value);
        props.setValue(cuestion.name, value.toString());
    };

    return (
        <section className="flex flex-col gap-2 mt-10 mx-auto w-full">
            <label>{cuestion.label}</label>
            <div className="flex gap-2">
                {cuestion.stars &&
                    cuestion.stars.map((star) => (
                        <Star
                            key={star}
                            className={cn("transition-all duration-300 cursor-pointer", star <= (hover || rating) ? "text-green-500 stroke-green-500 fill-green-500" : " text-gray-500 stroke-slate-500 hover:text-green-500 hover:stroke-green-500 hover:fill-green-500")}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => handleRating(star)}
                            size={30}
                        />
                    ))}
            </div>
        </section>
    );
}