import { Modal } from "@/components/modal";
import { useGetMutation, usePutMutation } from "@/hooks/reducers/api";
import { cn } from "@/utils/functions/cn";
import { Check, ChevronRight, FileText, MessageSquare, ScanBarcode } from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ModalProps {
    name: string;
    title: string;
    idListas: number;
    idPedido: number;
}

interface PedidoData {
    id: number;
    id_cliente: number;
    sucursal: string;
    servicio: string;
    array_lista: any[];
}

const ModalPedidos = ({ name, title, idListas, idPedido }: ModalProps) => {
    const [pedidoDetails, setPedidoDetails] = useState<PedidoData | null>(null);
    const [getWithFilter] = useGetMutation();
    const [putOrder] = usePutMutation();

    const handleCheckboxChange = (index: number) => {
        if (!pedidoDetails) return;
        const updatedLista = pedidoDetails.array_lista.map((item, i) =>
            i === index ? { ...item, recojido: !item.recojido } : item
        );
        setPedidoDetails({ ...pedidoDetails, array_lista: updatedLista });
    };

    const generatePDF = () => {
        if (!pedidoDetails) return;
        const columns = [
            ...Object.keys(pedidoDetails.array_lista[0])
                .filter(key => key !== "recojido")
                .map(key => ({
                    title: key === "id" ? "Código Barras" : key,
                    dataKey: key
                })),
            { title: "Recolectado", dataKey: "" }
        ];

        const tableData = pedidoDetails.array_lista.map(item => ({
            ...item,
            recojido: item.recojido ? "Sí" : "No"
        }));

        const doc = new jsPDF();
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

    async function getServerSideProps() {

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
    }

    useEffect(() => {
        if (idListas) getPedidoInfo();
    }, [idListas]);

    return (
        <Modal modalName={name} title={title}>
            <>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <FileText className="h-6 w-6 text-green-600" />
                </span>

                {pedidoDetails ? (
                    <>
                        <ul className="mt-6 space-y-4">
                            <li className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex gap-2">
                                    <p className="font-medium">Servicio:</p>
                                    <p>{pedidoDetails.servicio}</p>
                                </div>
                                <div className="flex gap-2">
                                    <p className="font-medium">Sucursal:</p>
                                    <p>{pedidoDetails.sucursal}</p>
                                </div>
                            </li>

                            <li className="border-t pt-4">
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
                                            className="border my-2 rounded-lg border-l-4 border-l-green-500 shadow-sm"
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

                                                    {/*  <nav className="flex items-center justify-between">
                                                        <h4 className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Comments (2)</span>
                                                        </h4>
                                                        <button className="text-sm text-blue-600">
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </nav> */}
                                                </header>
                                            </section>
                                        </article>
                                    ))}
                                </section>
                            </li>
                        </ul>

                        <footer className="flex flex-wrap justify-end gap-3 pt-4 mt-4 border-t">
                            <button
                                onClick={() => alert("Incompleto")}
                                className="bg-red-500 text-white px-4 py-2 rounded-md"
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
                                                Plan: "Pick Up",
                                                Id_Lista: idListas,
                                                Estado: "listo"
                                            }
                                        ]
                                    }, idPedido)
                                    getServerSideProps();
                                }}
                                className="bg-green-500 text-white px-4 py-2 rounded-md"
                                disabled={
                                    !pedidoDetails.array_lista.every(item => item.recojido)
                                }
                            >
                                Listo
                            </button>
                            <button
                                onClick={() => updateCita({
                                    Citas: [
                                        {
                                            Id_Cliente: pedidoDetails.id_cliente,
                                            Id_Usuario_Responsable: 1,
                                            Plan: "Pick Up",
                                            Id_Lista: idListas,
                                            Estado: "proceso"
                                        }
                                    ]
                                }, idPedido)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            >
                                Proceso
                            </button>
                            <button
                                onClick={generatePDF}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" /> PDF
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
    );
};

export default ModalPedidos;
