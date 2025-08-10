import { Modal } from "@/components/modal";
import { useGetMutation, usePutMutation } from "@/hooks/reducers/api";
import { cn } from "@/utils/functions/cn";
import { Check, FileText, MessageCircle, ScanBarcode } from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToExcel } from "@/app/reporteria/utils/export-excel";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer, openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";
import { ModalChat } from "./modal-chat";
import { sendMessage } from "../utils/use-db-firebase";

interface ModalProps {
    name: string;
    title: string;
    idListas: number;
    idPedido: number;
    idCliente: number;
}

interface PedidoData {
    id: number;
    id_cliente: number;
    sucursal: string;
    servicio: string;
    array_lista: any[];
}

const ModalPedidos = ({ name, title, idListas, idCliente, idPedido }: ModalProps) => {
    const [pedidoDetails, setPedidoDetails] = useState<PedidoData | null>(null);
    const [clienteDetails, setClienteDetails] = useState<any[] | []>([]);
    const [getWithFilter] = useGetMutation();
    const [putOrder] = usePutMutation();
    const dispatch = useAppDispatch();
    const handleCheckboxChange = (index: number) => {
        if (!pedidoDetails) return;
        const updatedLista = pedidoDetails.array_lista.map((item, i) =>
            i === index ? { ...item, recojido: !item.recojido } : item
        );
        setPedidoDetails({ ...pedidoDetails, array_lista: updatedLista });
    };

    const generatePDF = () => {
        if (!pedidoDetails) return;
        type Column = { title: string; dataKey: string; };

        const titleMap: Record<string, string> = {
            id: "Código Barras",
            cantidad: "Inventario disponible",
            quantity: "Cantidad"
        };

        // Construir columnas con tipado correcto
        let columns: Column[] = Object.keys(pedidoDetails.array_lista[0])
            .filter(key => key !== "recojido")
            .map((key) => ({
                title: titleMap[key] ?? key,
                dataKey: key
            }));

        // Reordenar: mover "Inventario disponible" después de "articulo"
        const articuloIdx = columns.findIndex(col => col.dataKey === "articulo");
        const cantidadIdx = columns.findIndex(col => col.dataKey === "cantidad");
        if (articuloIdx !== -1 && cantidadIdx !== -1 && cantidadIdx !== articuloIdx + 1) {
            const [cantidadCol] = columns.splice(cantidadIdx, 1);
            const newPosition = cantidadIdx < articuloIdx ? articuloIdx : articuloIdx + 1;
            columns.splice(newPosition, 0, cantidadCol);
        }

        // Reordenar: mover "Cantidad" antes de "unidad"
        const unidadIdx = columns.findIndex(col => col.dataKey === "unidad");
        const quantityIdx = columns.findIndex(col => col.dataKey === "quantity");
        if (unidadIdx !== -1 && quantityIdx !== -1 && unidadIdx !== quantityIdx + 1) {
            const [quantityCol] = columns.splice(quantityIdx, 1);
            const newPosition = quantityIdx < unidadIdx ? unidadIdx : unidadIdx + 1;
            columns.splice(unidadIdx, 0, quantityCol);
        }

        // Agregar columna de recolectado
        columns.push({ title: "Recolectado", dataKey: "recojido" });

        const tableData = pedidoDetails.array_lista.map(item => ({
            ...item,
            recojido: item.recojido ? "Sí" : "No"
        }));

        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(18);
        doc.text(`Pedido #${pedidoDetails.id}`, 10, 20);
        doc.setFontSize(12);
        doc.text(`Servicio: ${pedidoDetails.servicio}`, 10, 30);
        doc.text(`Sucursal: ${pedidoDetails.sucursal}`, 10, 36);

        autoTable(doc, {
            head: [columns.map(c => c.title)],
            body: tableData.map(row => columns.map(c => row[c.dataKey])),
            startY: 40,
            theme: "grid",
            styles: { fontSize: 10 },
        });

        doc.save(`pedido-${pedidoDetails.id}.pdf`);
    };

    const updateCita = async (dataUpdater: any, id: number) => {
        await putOrder({
            url: "citas",
            data: dataUpdater,
            id: id
        });
    };

    const getPedidoInfo = async () => {
        const { data: Pedidos } = await getWithFilter({
            url: "listas",
            filters: { Filtros: [{ Key: "id", Value: idListas }] },
        });

        if (Pedidos?.data?.[0]) {
            const parsedData = {
                ...Pedidos.data[0],
                array_lista: JSON.parse(Pedidos.data[0].array_lista).map((item: any) => ({
                    ...item,
                    recojido: item.recojido || false
                }))
            };
            setPedidoDetails(parsedData);
        }
    };

    const getClienteInfo = async () => {
        const { data: Cliente } = await getWithFilter({
            url: "clientes",
            sum: false,
            distinct: false,
            page: "1",
            filters: {
                "Filtros": [{ "Value": idCliente, "key": "id" }],
                "Selects": [{ "Key": "" }],
                "Order": [{ "Key": "", "Direction": "" }]
            }
        });

        if (Cliente?.data?.[0]) {
            const clienteData = Cliente.data
            setClienteDetails(clienteData);
        }
    };

    async function getServerSideProps() {
        const mapArts = pedidoDetails ? pedidoDetails.array_lista.map((row: any) => ({
            codigo: row.id,
            articulo: row.articulo,
            cantidad: row.quantity,
            unidad: row.unidad,
            precio: row.precio,
            tipoiva: "",
            'tipo ieps': "",
            cc: "",
            'costo unitario': '',
            observaciones: "PICK UP"
        })) : [];
        try {
            exportToExcel(mapArts, `${new Date().toISOString()}_venta_pick_up.xlsx`)

            // Enviar mensaje al cargar la página
            /* const response = await sendWhatsAppMessage({
                to: '+5216462895421',
                body: '{"1":"12/1","2":"3pm"}',
                contentSid: 'HX350d429d32e64a552466cafecbe95f3c',
            });
     
            return {
                props: {
                    messageStatus: response.success ? 'Enviado' : 'Error'
                }
            }; */

            dispatch(closeModalReducer({ modalName: "pedido" }))
            dispatch(openAlertReducer({
                title: "Venta generada",
                message: "La lista a sido generada exitosamente",
                type: "success",
                icon: "archivo",
                duration: 4000
            }))
        } catch (error) {
            console.log(error);

            dispatch(openAlertReducer({
                title: "Error!",
                message: "error",
                type: "error",
                icon: "alert",
                duration: 4000
            }))
        }
    }

    useEffect(() => {
        if (idListas) {
            getPedidoInfo();
            getClienteInfo();
        }
    }, [idListas]);

    return (
        <>
            <Modal modalName={name} title={title}>
                <>
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <FileText className="h-6 w-6 text-green-600" />
                    </span>
                    {clienteDetails.length > 0 && clienteDetails.map(
                        (row: any, key: any) => (
                            <article className="mt-3" key={key}>
                                <section className="grid grid-cols-2 gap-4 text-sm list-none">
                                    <span className="text-gray-600 dark:text-gray-100">Nombre</span>
                                    <li>{row.nombre}</li>

                                    <span className="text-gray-600 dark:text-gray-100">Ciudad</span>
                                    <li>{row.ciudad}</li>

                                    <span className="text-gray-600 dark:text-gray-100">Estado</span>
                                    <li>{row.estado}</li>

                                    <span className="text-gray-600 dark:text-gray-100">Direccion</span>
                                    <li>{row.direccion}</li>
                                </section>
                            </article>
                        )
                    )}
                    {pedidoDetails ? (
                        <>
                            <ul className="mt-6 space-y-4">
                                <li className="grid grid-cols-2 gap-4 text-sm">
                                    <label className="flex gap-2">
                                        <p className="font-medium">Servicio:</p>
                                        <p>{pedidoDetails.servicio}</p>
                                    </label>
                                    <label className="flex gap-2">
                                        <p className="font-medium">Sucursal:</p>
                                        <p>{pedidoDetails.sucursal}</p>
                                    </label>
                                </li>

                                <li className="border-t border-gray-200 pt-4">
                                    <h4 className="font-medium mb-2">
                                        Artículos:
                                        <span className={cn(
                                            pedidoDetails.array_lista.every(item => item.recojido)
                                                ? "text-gray-500"
                                                : "text-red-600",
                                            "border border-gray-300 ml-4 rounded-lg p-2"
                                        )}>
                                            {pedidoDetails.array_lista.length}
                                        </span>
                                    </h4>
                                    <section className="flex flex-col w-full">
                                        {pedidoDetails.array_lista.map((item, key) => (
                                            <article
                                                key={key}
                                                className="border my-2 rounded-lg border-l-4 border-l-green-500 border-gray-200 shadow-sm"
                                            >
                                                <section className="p-4">
                                                    <header className="flex flex-col gap-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <ul className="space-y-1">
                                                                <hgroup className="flex items-center gap-2">
                                                                    <h3 className="font-medium">{item.nombre}</h3>
                                                                    <mark className="inline-flex bg-green-500 text-white items-center rounded px-2.5 py-0.5 text-xs font-semibold">
                                                                        {item.categoria}
                                                                    </mark>
                                                                </hgroup>
                                                                <dl className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <dt>Cantidad:</dt>
                                                                        <dd className="font-medium">
                                                                            {item.quantity} {item.unidad}
                                                                        </dd>
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <ScanBarcode className="h-4 w-4" />
                                                                        <dd className="font-mono">{item.id}</dd>
                                                                    </span>
                                                                    <span className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4"
                                                                            checked={item.recojido}
                                                                            onChange={() => handleCheckboxChange(key)}
                                                                        />
                                                                        {item.recojido && (
                                                                            <output className="flex gap-1 items-center text-sm text-green-600">
                                                                                <Check className="inline h-4 w-4" /> Ready
                                                                            </output>
                                                                        )}
                                                                    </span>
                                                                </dl>
                                                            </ul>
                                                        </div>
                                                    </header>
                                                </section>
                                            </article>
                                        ))}
                                    </section>
                                </li>
                            </ul>

                            <footer className="flex flex-wrap justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        dispatch(openModalReducer({ modalName: clienteDetails[0]?.telefono }))
                                    }}
                                    className="flex gap-1 items-center bg-purple-500 text-white text-xs px-4 py-2 rounded-md cursor-pointer">
                                    <MessageCircle className="size-4" /> {clienteDetails[0]?.telefono}
                                </button>
                                <button
                                    onClick={() => updateCita({
                                        Citas: [
                                            {
                                                Id_Cliente: pedidoDetails.id_cliente,
                                                Id_Usuario_Responsable: 1,
                                                Plan: "Pickup",
                                                Id_Lista: idListas,
                                                Estado: "proceso"
                                            }
                                        ]
                                    }, idPedido)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
                                >
                                    Proceso
                                </button>
                                <button
                                    onClick={generatePDF}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
                                >
                                    <FileText className="h-4 w-4" /> PDF
                                </button>
                                <button
                                    onClick={async () => {
                                        await sendMessage(clienteDetails[0].telefono, "1", "Soporte", "Su pedido no se puede completar")
                                        dispatch(openAlertReducer({
                                            title: "Mensaje enviado",
                                            message: "El cliente ha sido notificado",
                                            type: "success",
                                            icon: "archivo",
                                            duration: 4000
                                        }));
                                        updateCita({
                                            Citas: [
                                                {
                                                    Id_Cliente: pedidoDetails.id_cliente,
                                                    Id_Usuario_Responsable: 1,
                                                    Plan: "Pickup",
                                                    Id_Lista: idListas,
                                                    Estado: "incompleto"
                                                }
                                            ]
                                        }, idPedido);
                                    }}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer active:bg-red-600"
                                >
                                    Incompleto
                                </button>
                                <button
                                    onClick={() => {
                                        updateCita({
                                            Citas: [
                                                {
                                                    Id_Cliente: pedidoDetails.id_cliente,
                                                    Id_Usuario_Responsable: 1,
                                                    Plan: "Pickup",
                                                    Id_Lista: idListas,
                                                    Estado: "listo"
                                                }
                                            ]
                                        }, idPedido);
                                        getServerSideProps();
                                    }}
                                    className="disabled:bg-gray-300 disabled:cursor-not-allowed bg-green-500 text-white px-4 py-2 rounded-md cursor-pointer"
                                    disabled={
                                        !pedidoDetails.array_lista.every(item => item.recojido)
                                    }
                                >
                                    Listo
                                </button>
                            </footer>
                        </>
                    ) : (
                        <p className="mt-4 text-center text-sm text-gray-500">
                            Cargando detalles del pedido...
                        </p>
                    )}

                </>
            </Modal>
            <ModalChat telefonoClient={clienteDetails[0]?.telefono} />
        </>
    );
};

export default ModalPedidos;
