import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { TasksField } from "../constants/tasks";

type modalFormProps = {
    nameModal: string;
    sprintId: number; // ID del sprint si es necesario
    dataModal?: any; // Componente del formulario
};

export const ModalForm: React.FC<modalFormProps> = ({ nameModal, dataModal, sprintId }) => {
    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            <MainForm
                actionType={"post-task"}
                dataForm={TasksField(dataModal && dataModal)}
                aditionalData={{ estado: "backlog", sprint_id: sprintId }}
                message_button="Crear Tarea"
            />
        </Modal>
    );
}