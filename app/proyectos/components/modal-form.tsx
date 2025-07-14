import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { TasksField } from "../constants/tasks";

type modalFormProps = {
    nameModal: string;
    formModal?: React.ReactNode; // Componente del formulario
};

export const ModalForm: React.FC<modalFormProps> = ({ nameModal, formModal }) => {
    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            {/* Aquí va el contenido del modal */}
            <h2>Formulario de Tarea</h2>
            <MainForm
                actionType="post-task"
                dataForm={TasksField()}
                message_button="Crear Tarea"
            />
        </Modal>
    );
}