import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { TasksField } from "../constants/tasks";

type modalFormProps = {
    nameModal: string;
    sprintId: number; // ID del sprint si es necesario
    formModal?: React.ReactNode; // Componente del formulario
};

export const ModalForm: React.FC<modalFormProps> = ({ nameModal, formModal, sprintId }) => {
    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            <MainForm
                actionType="post-task"
                dataForm={TasksField()}
                aditionalData={{ estado: "backlog", sprint_id: sprintId }}
                message_button="Crear Tarea"
            />
        </Modal>
    );
}