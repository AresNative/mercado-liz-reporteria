import { useEffect, useState } from "react";
type ConunterInterface = {
    endDate: number;
    refrech: () => void;
};
export const CountdownTimer = ({ endDate, refrech }: ConunterInterface) => {
    const [countdown, setCountdown] = useState(calculateCountdown());

    function calculateCountdown() {
        const currentDate: any = new Date();
        const timezoneOffset = currentDate.getTimezoneOffset() * 60 * 1000;
        const endDateObject: any = new Date(
            new Date(endDate).getTime() - timezoneOffset
        );
        const timeDifference: any = endDateObject - currentDate;

        if (timeDifference > 0) {
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const minutes = Math.floor(
                (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

            return `${padWithZero(days)}d ${padWithZero(hours)}h ${padWithZero(
                minutes
            )}m ${padWithZero(seconds)}s`;
        } else {
            refrech();
            return "Expired";
        }
    }

    function padWithZero(number: number) {
        return number.toString().padStart(2, "0");
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(calculateCountdown());
        }, 1000);

        return () => clearInterval(interval); // Cleanup the interval on component unmount
    }, [endDate]);

    return <span>{countdown}</span>;
};