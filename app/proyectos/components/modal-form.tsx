import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";

type modalFormProps = {
    modalName: string;
    actionType: string;
    nameModal: string;
    aditionalData?: any; // ID del sprint si es necesario
    dataModal?: any; // Componente del formulario
    formFunction: any;
    formName: string;
    refetch: any;
    messageButton?: string; // Mensaje del botón, opcional
};

export const ModalForm: React.FC<modalFormProps> = ({ modalName, actionType, formName, nameModal, dataModal, aditionalData, formFunction, refetch, messageButton }) => {
    const dispatch = useAppDispatch();

    return (
        <Modal title={modalName} modalName={nameModal}>
            <MainForm
                actionType="post-general"
                table={actionType}
                modelName={formName}
                dataForm={formFunction(dataModal && dataModal)}
                aditionalData={aditionalData}
                onSuccess={() => {
                    dispatch(closeModalReducer({ modalName: nameModal }));
                    refetch();
                }}
                message_button={messageButton || "Guardar"}
            />
        </Modal>
    );
}