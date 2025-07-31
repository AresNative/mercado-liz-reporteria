import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";

type modalFormProps = {
    actionType: string;
    nameModal: string;
    sprintId?: number; // ID del sprint si es necesario
    dataModal?: any; // Componente del formulario
    formFunction: any;
    formName: string;
    refetch: any;
    messageButton?: string; // Mensaje del botón, opcional
};

export const ModalForm: React.FC<modalFormProps> = ({ actionType, formName, nameModal, dataModal, sprintId, formFunction, refetch, messageButton }) => {
    const dispatch = useAppDispatch();

    return (
        <Modal title="Formulario de Tarea" modalName={nameModal}>
            <MainForm
                actionType={actionType}
                modelName={formName}
                dataForm={formFunction(dataModal && dataModal)}
                aditionalData={{ estado: "backlog", sprint_id: sprintId, activo: 1 }}
                onSuccess={() => {
                    dispatch(closeModalReducer({ modalName: nameModal }));
                    refetch();
                }}
                message_button={messageButton || "Guardar"}
            />
        </Modal>
    );
}