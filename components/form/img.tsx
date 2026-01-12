
import { InputMediaProps } from "@/utils/types/interfaces";
import { Camera, Trash, User } from "lucide-react";
import { useCallback, useState } from "react";

export function ImgComponent(props: InputMediaProps) {

    const { cuestion } = props;

    const [profileImage, setProfileImage] = useState<string | null>(null);

    const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const files = Array.from(event.dataTransfer.files);

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result as string);
        };
        reader.readAsDataURL(files[0]);

    }, []);

    const preventDefault = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result as string);
        };
        reader.readAsDataURL(files[0]);
        props.setValue(cuestion.name, files);
    }, []);

    const clearAllFiles = () => {
        setProfileImage(null);
    };
    return (
        <div className="flex flex-col">
            <label className="leading-loose flex gap-2 items-center">
                <Camera className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div
                className="mt-1 flex flex-col gap-2 justify-center items-center"
                onDragOver={preventDefault}
                onDrop={(e) => handleFileDrop(e)}
            >
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300  dark:border-zinc-700 border-dashed">
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <User className="w-12 h-12" />
                        </div>
                    )}
                </div>
                <>
                    <input
                        id="file-upload-profile"
                        name="file-upload-profile"
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileInput(e)}
                        accept="image/*"
                    />
                    {profileImage && (
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => clearAllFiles()}
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
                <label
                    htmlFor="file-upload-profile"
                    className=" bg-white dark:bg-zinc-800 py-2 px-3 border border-gray-300  dark:border-zinc-700 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
                >
                    {profileImage ? 'Cambiar foto' : 'Subir foto'}
                </label>
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>

    )
}