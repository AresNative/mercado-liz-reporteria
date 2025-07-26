import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { TasksField } from "../constants/tasks";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { useGetScrumQuery } from "@/hooks/reducers/api";

type modalFormProps = {
    nameModal: string;
    sprintId: number; // ID del sprint si es necesario
    dataModal?: any; // Componente del formulario
};

export const ModalForm: React.FC<modalFormProps> = ({ nameModal, dataModal, sprintId }) => {
    const dispatch = useAppDispatch();
    const { refetch } = useGetScrumQuery({
        url: "sprints/27/tasks",
        signal: undefined,
    });
    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            <MainForm
                actionType={"post-task"}
                dataForm={TasksField(dataModal && dataModal)}
                aditionalData={{ estado: "backlog", sprint_id: sprintId }}
                onSuccess={() => {
                    dispatch(closeModalReducer({ modalName: 'create-task' }));
                    refetch();
                }}
                message_button="Crear Tarea"
            />
        </Modal>
    );
}