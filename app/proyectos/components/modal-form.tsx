import { Modal } from "@/components/modal";

type modalFormProps = {
    nameModal: string;
    formModal: React.ReactNode; // Componente del formulario
    onSubmit: (data: any) => void; // Define el tipo de datos según tu formulario
};

export const ModalForm: React.FC<modalFormProps> = ({ nameModal, formModal }) => {
    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            {/* Aquí va el contenido del modal */}
            <h2>Formulario de Tarea</h2>
            {formModal}
        </Modal>
    );
}