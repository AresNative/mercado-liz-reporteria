"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { Button } from "@/components/button";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface TerminosCondicionesModalProps {
    onAccept?: () => void;   // Callback al aceptar (para registro)
    onReject?: () => void;   // Callback al rechazar
    showAcceptButton?: boolean;
}

export function TerminosCondicionesModal({
    onAccept,
    onReject,
    showAcceptButton = false,
}: TerminosCondicionesModalProps) {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(
        (state: any) => state.dropDownReducer.modals["terminos-condiciones"]
    );

    if (!isOpen) return null;

    const handleClose = () => {
        dispatch(closeModalReducer({ modalName: "terminos-condiciones" }));
    };

    const handleAccept = () => {
        onAccept?.();
        handleClose();
    };

    const handleReject = () => {
        onReject?.();
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        Términos y Condiciones
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Contenido con scroll */}
                <div className="flex-1 overflow-y-auto p-6 text-gray-700 dark:text-gray-300 space-y-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {/* Título principal */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            TÉRMINOS Y CONDICIONES DE USO Y POLÍTICA DE PRIVACIDAD
                        </h1>
                        <p className="text-sm text-gray-500">
                            <strong>LIZ PICK-UP</strong> · SUPERMERCADOS MEJIA S. DE R.L. DE C.V.
                            <br />
                            <em>Comprasmercadoliz@gmail.com</em>
                            <br />
                            Vigencia: 23 de julio 2026 – 23 de julio 2027
                        </p>

                        <hr className="my-6" />

                        {/* I. Términos y Condiciones */}
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">
                            I. TÉRMINOS Y CONDICIONES DE USO
                        </h2>

                        <h3>1. Aceptación de los términos</h3>
                        <p>
                            Al descargar, acceder o utilizar la aplicación <strong>LIZ PICK-UP</strong> (en adelante, “la App”), el usuario acepta quedar vinculado por los presentes Términos y Condiciones, así como por la Política de Privacidad. Si no está de acuerdo, deberá abstenerse de utilizar la App.
                        </p>

                        <h3>2. Capacidad legal</h3>
                        <p>
                            El usuario declara ser mayor de edad (o tener al menos 18 años) y contar con la capacidad legal para contratar. Los menores de edad solo podrán usar la App bajo supervisión de un adulto responsable.
                        </p>

                        <h3>3. Registro y cuenta</h3>
                        <ul>
                            <li>Para realizar pedidos, el usuario debe crear una cuenta proporcionando información veraz, completa y actualizada (nombre, dirección, correo electrónico, teléfono, etc.).</li>
                            <li>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta.</li>
                            <li>Mercado Liz se reserva el derecho de suspender o cancelar cuentas en caso de uso fraudulento o violación de estos términos.</li>
                        </ul>

                        <h3>4. Productos y precios</h3>
                        <ul>
                            <li>Las imágenes y descripciones de los productos son meramente referenciales. El producto real puede variar ligeramente.</li>
                            <li>Los precios se muestran en la moneda local (MXN) e incluyen o excluyen impuestos según se indique.</li>
                            <li>Mercado Liz se reserva el derecho de modificar precios, disponibilidad y promociones sin previo aviso, salvo pedidos ya confirmados.</li>
                        </ul>

                        <h3>5. Proceso de compra y confirmación</h3>
                        <ul>
                            <li>Una vez que el usuario completa el pedido, recibe un correo o notificación con el detalle. Este no constituye una aceptación definitiva.</li>
                            <li>Mercado Liz podrá rechazar un pedido por falta de stock, error en el precio, sospecha de fraude o cualquier causa justificada, notificando al usuario y reembolsando cualquier cargo realizado.</li>
                        </ul>

                        <h3>6. Modalidades de entrega</h3>
                        <h4>a) Recogida en tienda (pick-up)</h4>
                        <ul>
                            <li>El usuario selecciona la opción “Recoger en tienda” y elige el local correspondiente.</li>
                            <li>El pedido estará disponible en el horario y plazo indicados (por ejemplo, “2 horas después de la confirmación”).</li>
                            <li>El usuario debe presentar el número de pedido y, en su caso, identificación oficial al retirar el producto.</li>
                            <li>Si el usuario no retira el pedido en 4 horas después de la hora pactada, Mercado Liz podrá cancelarlo sin derecho a reembolso, salvo que se haya pagado por adelantado; en ese caso se contactará al usuario para reprogramar.</li>
                        </ul>
                        <h4>b) Entrega a domicilio</h4>
                        <ul>
                            <li>El usuario proporciona una dirección válida para la entrega, así como instrucciones adicionales (piso, código, etc.).</li>
                            <li>El tiempo de entrega es estimado y puede variar por condiciones externas (tráfico, clima, etc.).</li>
                            <li>A la entrega, el usuario o un receptor autorizado deberá firmar digitalmente o proporcionar un código de verificación.</li>
                            <li>Si el usuario no se encuentra en la dirección después de 2 intentos de entrega, el pedido será devuelto a Mercado Liz y se podrá cobrar un cargo adicional por nuevo envío.</li>
                        </ul>

                        <h3>7. Pagos</h3>
                        <h4>a) Pedidos con recogida en tienda (Pick-Up)</h4>
                        <ul>
                            <li>Todos los pedidos realizados bajo la modalidad de Recoger en tienda se pagarán únicamente al momento de recoger el pedido en la sucursal seleccionada.</li>
                            <li>La realización del pedido no genera ningún cargo ni requiere un pago anticipado.</li>
                            <li>El usuario deberá acudir a la sucursal dentro del plazo establecido para efectuar el pago y recoger su pedido.</li>
                            <li>El pago podrá realizarse mediante cualquiera de los métodos de pago aceptados por la sucursal al momento de la entrega.</li>
                        </ul>
                        <h4>b) Pedidos con entrega a domicilio</h4>
                        <ul>
                            <li>Los pedidos con entrega a domicilio podrán pagarse mediante los métodos de pago habilitados en la aplicación al momento de realizar el pedido.</li>
                            <li>Dependiendo de la disponibilidad en la zona de servicio, los métodos de pago podrán incluir: tarjetas de crédito y débito, transferencias electrónicas, pago en efectivo contra entrega, cuando dicha modalidad esté disponible.</li>
                            <li>Los pagos electrónicos serán procesados a través de proveedores de pago autorizados que cumplen con los estándares de seguridad aplicables. Mercado Liz no almacena la información confidencial de las tarjetas bancarias de los usuarios.</li>
                            <li>En caso de pago contra entrega, el usuario deberá contar con el importe correspondiente al momento de recibir su pedido, de conformidad con las políticas aplicables.</li>
                            <li>La disponibilidad de los métodos de pago podrá variar según la ubicación del usuario, la sucursal, el importe del pedido o las condiciones operativas del servicio.</li>
                        </ul>

                        <h3>8. Cancelaciones, devoluciones y garantías</h3>
                        <ul>
                            <li><strong>Cancelación por el usuario</strong>: Podrá cancelar sin costo si el pedido aún no ha sido preparado. Si ya está en preparación o en ruta, Mercado Liz podrá rechazar la cancelación.</li>
                            <li><strong>Devoluciones</strong>: El usuario podrá solicitar devolución dentro de los 2 días posteriores a la recepción si el producto presenta defectos de fabricación, daños por transporte o no corresponde al pedido. El producto debe estar en su embalaje original y con sus respectivos métodos de sellado.</li>
                            <li><strong>No aplica devolución</strong> por productos perecederos, íntimos o personalizados, salvo defectos evidentes.</li>
                            <li>El reembolso se realizará en efectivo directamente en sucursal donde se haya realizado dicha operación en un plazo no mayor a 5 días hábiles.</li>
                        </ul>

                        <h3>9. Responsabilidad limitada</h3>
                        <ul>
                            <li>Mercado Liz no se hace responsable por demoras o fallos derivados de casos fortuitos o fuerza mayor (desastres naturales, huelgas, ciberataques, etc.).</li>
                            <li>La App se proporciona “tal cual”. No garantizamos que esté libre de errores o que funcione sin interrupciones.</li>
                            <li>Nuestra responsabilidad total por cualquier reclamo relacionado con un pedido no excederá el valor pagado por dicho pedido.</li>
                        </ul>

                        <h3>10. Propiedad intelectual</h3>
                        <p>
                            Todo el contenido de la App (logotipos, textos, gráficos, software) es propiedad de Mercado Liz o de sus licenciantes. Queda prohibido reproducir, modificar o distribuir dicho contenido sin autorización expresa.
                        </p>

                        <h3>11. Modificaciones a los Términos</h3>
                        <p>
                            Nos reservamos el derecho de actualizar estos términos en cualquier momento. Publicaremos la versión modificada dentro de la App, y el uso continuado después de 14 días de la notificación implicará la aceptación de los cambios.
                        </p>

                        <h3>12. Legislación aplicable y jurisdicción</h3>
                        <p>
                            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será sometida a los tribunales competentes de Ensenada, Baja California, México renunciando a cualquier otro fuero que pudiera corresponderles.
                        </p>

                        <hr className="my-6" />

                        {/* II. Política de Privacidad */}
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">
                            II. POLÍTICA DE PRIVACIDAD
                        </h2>

                        <h3>1. Responsable del tratamiento</h3>
                        <p>
                            El responsable del tratamiento de sus datos personales es Mercado Liz con domicilio en calle principal numero 216 1005, Ensenada, Baja California, México, C.P. 22750 y correo electrónico <a href="mailto:Comprasmercadoliz@gmail.com">Comprasmercadoliz@gmail.com</a>.
                        </p>

                        <h3>2. Datos que recopilamos</h3>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Categoría</th>
                                    <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Ejemplos</th>
                                    <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">Finalidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Datos de identificación</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Nombre, apellidos, documento de identidad, edad.</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Crear cuenta, verificar identidad en pick-up.</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Datos de contacto</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Correo electrónico, teléfono, dirección de envío.</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Comunicaciones de pedido, entregas a domicilio.</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Datos de pago</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Información de tarjeta (tokenizada), historial de compras.</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Procesar pagos y gestionar devoluciones.</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Datos de navegación</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Dirección IP, tipo de dispositivo, versión de Android, interacciones dentro de la App.</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Mejorar la experiencia, análisis de seguridad.</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Datos de ubicación</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Ubicación precisa (solo con permiso del usuario).</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Mostrar tiendas cercanas, calcular rutas de entrega, geolocalizar al repartidor.</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Imágenes / cámara</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Fotos de productos (para reseñas) o escaneo de QR de pedido.</td>
                                    <td className="border border-gray-300 dark:border-gray-700 p-2">Funcionalidades opcionales.</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>3. Permisos de la App en Android</h3>
                        <p>La App solicitará los siguientes permisos, y el usuario podrá denegarlos parcialmente, aunque algunas funciones se verían limitadas:</p>
                        <ul>
                            <li><strong>Ubicación (en primer plano o fondo):</strong> necesaria para sugerir tiendas pick-up cercanas y para que el repartidor encuentre la dirección de entrega. Se usará solo mientras la función esté activa.</li>
                            <li><strong>Cámara:</strong> opcional, para leer códigos QR en la recogida de pedidos o subir fotos de productos.</li>
                            <li><strong>Notificaciones push:</strong> para informar sobre el estado del pedido (confirmación, envío, listo para recoger).</li>
                            <li><strong>Almacenamiento:</strong> para guardar comprobantes temporales o imágenes seleccionadas por el usuario.</li>
                        </ul>

                        <h3>4. Uso de la información</h3>
                        <p>Sus datos serán utilizados para:</p>
                        <ul>
                            <li>Gestionar, procesar y entregar sus pedidos.</li>
                            <li>Enviar notificaciones sobre el estado de su compra.</li>
                            <li>Atender solicitudes de soporte, devoluciones o reclamaciones.</li>
                            <li>Enviar, con su consentimiento previo, comunicaciones comerciales (ofertas, novedades). El usuario puede darse de baja en cualquier momento.</li>
                            <li>Prevenir fraudes y cumplir con obligaciones legales (facturación, registros fiscales).</li>
                        </ul>

                        <h3>5. Compartición de datos con terceros</h3>
                        <p>No vendemos ni alquilamos sus datos personales. Solo los compartimos con:</p>
                        <ul>
                            <li><strong>Pasarelas de pago</strong> – información de pago de forma segura.</li>
                            <li><strong>Autoridades competentes</strong> – cuando lo exija una ley o requerimiento judicial.</li>
                            <li><strong>Proveedores de servicios técnicos</strong> (hosting, análisis de datos) bajo acuerdos de confidencialidad.</li>
                        </ul>

                        <h3>6. Conservación de datos</h3>
                        <p>
                            Conservaremos sus datos mientras su cuenta esté activa o durante el plazo necesario para cumplir las finalidades descritas, y posteriormente durante los plazos legales aplicables (por ejemplo, fiscales: 5 años).
                        </p>

                        <h3>7. Derechos del usuario (ARCO y otros)</h3>
                        <p>Usted tiene derecho a:</p>
                        <ul>
                            <li><strong>Acceder</strong> a sus datos personales.</li>
                            <li><strong>Rectificarlos</strong> si son inexactos.</li>
                            <li><strong>Cancelarlos</strong> (solicitar su eliminación).</li>
                            <li><strong>Oponerse</strong> al tratamiento para fines comerciales.</li>
                            <li><strong>Portabilidad</strong> (recibir sus datos en formato estructurado).</li>
                        </ul>
                        <p>
                            Para ejercer estos derechos, envíe un correo a <a href="mailto:Comprasmercadoliz@gmail.com">Comprasmercadoliz@gmail.com</a> indicando su nombre y el derecho que desea ejercer. Atenderemos su solicitud en un plazo máximo de 30 días hábiles.
                        </p>

                        <h3>8. Seguridad de los datos</h3>
                        <p>
                            Implementamos medidas técnicas y organizativas (cifrado SSL/TLS, controles de acceso, firewalls) para proteger sus datos. Sin embargo, ninguna transmisión por Internet es 100% segura.
                        </p>

                        <h3>9. Menores de edad</h3>
                        <p>
                            No recopilamos deliberadamente información de menores de 18 años. Si detectamos que un menor ha proporcionado datos sin consentimiento parental, los eliminaremos de forma inmediata.
                        </p>

                        <h3>10. Cambios en la Política de Privacidad</h3>
                        <p>
                            Cualquier cambio significativo será notificado mediante un aviso destacado dentro de la App o por correo electrónico, con al menos 30 días de anticipación.
                        </p>

                        <hr className="my-6" />

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            DISPOSICIONES ADICIONALES PARA ANDROID (Google Play)
                        </h2>
                        <p>
                            Al publicar la App en Google Play, también debes cumplir con la <strong>Política de Datos de Usuario de Google</strong>. Incluye en tu ficha de Play Store:
                        </p>
                        <ul>
                            <li>Declarar qué tipo de datos recopilas (ubicación, contactos, etc.).</li>
                            <li>Justificar cada permiso (por ejemplo, “La ubicación se usa para calcular la distancia a la tienda más cercana”).</li>
                            <li>Asegurarte de que la política de privacidad esté accesible desde la ficha de la App (enlace a una página web pública).</li>
                        </ul>
                    </div>
                </div>

                {/* Footer con acciones */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                    {showAcceptButton ? (
                        <>
                            <Button color="second" onClick={handleReject}>
                                Rechazar
                            </Button>
                            <Button color="success" onClick={handleAccept}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Acepto los términos
                            </Button>
                        </>
                    ) : (
                        <Button color="completed" onClick={handleClose}>
                            Cerrar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}