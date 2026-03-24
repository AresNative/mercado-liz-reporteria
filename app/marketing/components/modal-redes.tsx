import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";

const ModalRedes = () => {
    return (
        <Modal title="Crear Red Social" modalName="modalMarketingRedes">
            <MainForm
                table="redes_sociales"
                dataForm={[
                    {
                        require: false,
                        type: "INPUT",
                        label: "URL",
                        name: "url"
                    },
                    {
                        require: false,
                        type: "INPUT",
                        label: "Icono",
                        name: "icon"
                    }

                ]}
                aditionalData={{ fecha: new Date() }}
                actionType="post-general"
                message_button="Crear"
            />
        </Modal>)
}
export default ModalRedes;