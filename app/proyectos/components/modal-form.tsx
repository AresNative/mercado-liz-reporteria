import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { useGetScrumQuery } from "@/hooks/reducers/api";

type modalFormProps = {
    action: string;
    nameModal: string;
    sprintId: number; // ID del sprint si es necesario
    dataModal?: any; // Componente del formulario
    formFunction: any
};

export const ModalForm: React.FC<modalFormProps> = ({ action, nameModal, dataModal, sprintId, formFunction }) => {
    const dispatch = useAppDispatch();
    const { refetch } = useGetScrumQuery({
        url: `sprints/${sprintId}/tasks`,
        signal: undefined,
    });
    console.log(action);

    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            <MainForm
                actionType={action}
                dataForm={formFunction(dataModal && dataModal)}
                aditionalData={{ estado: "backlog", sprint_id: sprintId, Activo: 1 }}
                onSuccess={() => {
                    dispatch(closeModalReducer({ modalName: 'create-task' }));
                    refetch();
                }}
                message_button="Crear Tarea"
            />
        </Modal>
    );
}