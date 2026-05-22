import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";

const ModalRedes = () => {
    return (
        <Modal title="Crear Red Social" modalName="modalMarketingRedes" >
            <MainForm
                table="redes_sociales"
                dataForm={[
                    {
                        require: false,
                        type: "SELECT",
                        label: "Red Social",
                        name: "red_social",
                        options:
                            [
                                { label: "Facebook", value: "facebook" },
                                { label: "Instagram", value: "instagram" },
                                { label: "X", value: "x" },
                                { label: "TikTok", value: "tiktok" },
                                { label: "LinkedIn", value: "linkedin" }
                            ]
                    },
                    {
                        require: false,
                        type: "INPUT",
                        label: "URL",
                        name: "url"
                    },

                   /*  {
                        require: false,
                        type: "INPUT",
                        label: "Icono",
                        name: "icon"
                    },
                    {
                        require: false,
                        type: "INPUT",
                        label: "red social",
                        name: "red_social"
                    } */
                ]}
                aditionalData={{ fecha: new Date() }}
                actionType="post-general"
                message_button="Crear"
            />
        </Modal>)
}
export default ModalRedes;