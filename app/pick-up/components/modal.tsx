import { Modal } from "@/components/modal";
import { useGetMutation, usePostMutation } from "@/hooks/reducers/api";
import { cn } from "@/utils/functions/cn";
import { Check, ChevronRight, FileText, MessageSquare, ScanBarcode } from "lucide-react";
import { useEffect, useState } from "react";
/* import { sendWhatsAppMessage } from "./message-whats"; */
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
    const [putOrder] = usePostMutation();

    // Función para manejar cambios en los checkboxes
    const handleCheckboxChange = (index: number) => {
        if (!pedidoDetails) return;

        const updatedLista = pedidoDetails.array_lista.map((item, i) =>
            i === index ? { ...item, recojido: !item.recojido } : item
        );

        setPedidoDetails({
            ...pedidoDetails,
            array_lista: updatedLista
        });
    };

    const generatePDF = () => {
        if (!pedidoDetails) return;

        // Configurar columnas y datos para la tabla principal
        const columns = [
            ...Object.keys(pedidoDetails.array_lista[0])
                .filter(key => key !== 'recojido')
                .map(key => ({
                    title: key === 'id' ? 'Código Barras' : key,
                    dataKey: key
                })),
            {
                title: 'Recolectado',
                dataKey: '',
            }
        ];

        // Y en tableData mantenemos el campo recojido
        const tableData = pedidoDetails.array_lista.map(item => ({
            ...item,
            recojido: item.recojido // Se mantiene el valor booleano para el formateador
        }));

        // Crear PDF
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Título principal
        doc.setFontSize(18);
        doc.text(`Pedido #${pedidoDetails.id}`, 10, 20);

        // Información del pedido
        doc.setFontSize(12);
        doc.text(`Servicio: ${pedidoDetails.servicio}`, 10, 30);
        doc.text(`Sucursal: ${pedidoDetails.sucursal}`, 10, 36);

        // Tabla de productos
        autoTable(doc, {
            head: [columns.map(c => c.title)],
            body: tableData.map(row => columns.map(c => row[c.dataKey])),
            startY: 40,
            theme: "grid",
            styles: { fontSize: 10 },
            margin: { top: 10 }
        });

        // Guardar PDF
        doc.save(`pedido-${pedidoDetails.id}-${new Date().toISOString()}.pdf`);
    };

    async function updateCita(dataUpdater: any, id: number) {
        const { data: Response } = await putOrder({
            url: "citas",
            data: dataUpdater,
            ID: id
        })
        console.log(Response)
    }

    async function getPedidoInfo() {
        const { data: Pedidos } = await getWithFilter({
            url: "listas",
            filters: {
                "Filtros": [{ "Key": "id", "Value": idListas }],
            },
        });

        if (Pedidos?.data?.[0]) {
            const parsedData = {
                ...Pedidos.data[0],
                array_lista: JSON.parse(Pedidos.data[0].array_lista).map((item: any) => ({
                    ...item,
                    recojido: item.recojido || false // Asegurar valor booleano
                }))
            };
            setPedidoDetails(parsedData);
        }
    }

    useEffect(() => {
        if (idListas) getPedidoInfo();
    }, [idListas]);

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
    return (
        <Modal modalName={name} title={title} >
            <div className="rounded-xl h-full">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <FileText className="h-6 w-6 text-purple-600" />
                </span>

                {pedidoDetails ? (
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
                            <h4 className="font-medium mb-2">Artículos:<span className={cn(pedidoDetails.array_lista.every(item => item.recojido) ? "text-gray-500" : "text-red-600", "border border-gray-300 ml-4 rounded-lg p-2")}>{pedidoDetails.array_lista.length}</span> </h4>
                            <section className="felx w-full">
                                {pedidoDetails.array_lista.map((item, key) => (
                                    <article key={key} className="border my-2 rounded-lg border-l-4 border-l-purple-500 shadow-sm">
                                        <section className="p-4">
                                            <header className="flex flex-col gap-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <hgroup className="flex items-center gap-2">
                                                            <h3 className="font-medium">{item.nombre}</h3>
                                                            <mark className="inline-flex items-center rounded-md border border-input px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                                                {item.categoria}
                                                            </mark>
                                                        </hgroup>

                                                        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <dt>Cantidad:</dt>
                                                                <dd className="font-medium">
                                                                    {item.quantity} {item.unidad}
                                                                </dd>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <figure>
                                                                    <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                                                                </figure>
                                                                <dd className="font-mono">{item.id}</dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <aside className="flex items-center gap-3">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <span className="inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-full border-2 border-transparent bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                                    checked={item.recojido || false}
                                                                    onChange={() => handleCheckboxChange(key)}
                                                                    role="switch"
                                                                />
                                                            </span>
                                                            {item.recojido && (
                                                                <output className="inline-flex items-center rounded-md border-0 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-500/15 text-purple-600 dark:bg-purple-500/10">
                                                                    <span className="flex items-center gap-1">
                                                                        <Check className="h-4 w-4 text-purple-500" />
                                                                        Ready
                                                                    </span>
                                                                </output>
                                                            )}
                                                        </label>
                                                    </aside>
                                                </div>

                                                <section>
                                                    <nav className="flex items-center justify-between">
                                                        <h4 className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">
                                                                Comments (2)
                                                            </span>
                                                        </h4>
                                                        <button
                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                            aria-label="Toggle comments"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </nav>
                                                </section>
                                            </header>
                                        </section>
                                    </article>
                                ))}
                            </section>
                        </li>

                        <footer className="flex flex-wrap justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                            {/*  <ButtonGroup>
                                <ButtonsGroup
                                    variant="danger"
                                    onClick={() => { }}
                            className="min-w-[6rem]"
                                >
                            Incompleto
                        </ButtonsGroup>

                        <ButtonsGroup
                            variant="primary"
                            onClick={getServerSideProps}
                            disabled={!pedidoDetails.array_lista.every(item => item.recojido) || pedidoDetails.array_lista.length === 0}
                            className="min-w-[6rem]"
                        >
                            Listo
                        </ButtonsGroup>

                        <ButtonsGroup
                            variant="primary"
                            onClick={() => updateCita({
                                "Citas": [
                                    {
                                        "Id_Cliente": 3,
                                        "Id_Usuario_Responsable": 1,
                                        "Fecha": "2025-04-28T20:07:42.206Z",
                                        "Plan": "Pickup",
                                        "Id_Lista": 12,
                                        "Estado": "proceso"
                                    }
                                ]
                            }, idPedido)}
                            className="min-w-[6rem]"
                        >
                            Proceso
                        </ButtonsGroup>

                        <ButtonsGroup
                            variant="secondary"
                            onClick={generatePDF}
                            className="min-w-[6rem] gap-1.5"
                        >
                            <FileText className="h-5 w-5" />
                            PDF
                        </ButtonsGroup>
                    </ButtonGroup> */}
                        </footer>
                    </ul>
                ) : (
                    <p className="mt-4 text-center text-sm text-gray-500">
                        Cargando detalles del pedido...
                    </p>
                )
                }
            </div >
        </Modal >
    )
}

export default ModalPedidos;