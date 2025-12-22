/* 
@serverless
printer tickets via serial port

Ejemplo de uso (React / Next.js - en cliente):
*   const portRef = useRef<any>(null);
*   const printer = new SerialPrinter();

*   const handleConnectPrinter = async () => {
*       const result = await printer.connectPrinter(portRef);
*       console.log("connect:", result);
*   };

*   const handleDisconnectPrinter = async () => {
*       const result = await printer.disconnectPrinter(portRef);
*       console.log("disconnect:", result);
*   };

*   const handlePrintTicket = async () => {
*       const ticket: TicketItem = {
*           id: 123,
*           name: "Producto de prueba",
*           price: 9.99,
*           quantity: 2,
*           barcode: "123456789012",
*       };
*       const result = await printer.printToSerial(ticket, portRef);
*       console.log("print:", result);
*   };
Nota: este código debe ejecutarse en el cliente (no en server components) ya que usa la API Serial del navegador.
*/

export interface TicketItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}
export class SerialPrinter {
  constructor() {}

  // Tipos para soportar uno o varios productos
  private isLegacyTicket(t: Ticket | TicketItem): t is TicketItem {
    return (t as TicketItem).name !== undefined;
  }

  async connectPrinter(portRef: any): Promise<boolean | string> {
    try {
      if (!("serial" in navigator)) {
        return "API Serial no disponible en este navegador";
      }
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      return true;
    } catch (err) {
      console.error("Error de conexión:", err);
      return "Error al conectar impresora";
    }
  }

  async disconnectPrinter(portRef: any): Promise<boolean | string> {
    try {
      if (portRef?.current) {
        const writer = portRef.current.writable?.getWriter();
        if (writer) {
          try {
            await writer.releaseLock();
          } catch {
            // ignore
          }
        }
        await portRef.current.close();
        portRef.current = null;
      }
      return true;
    } catch (err) {
      console.error("Error al desconectar:", err);
      return "Error al desconectar";
    }
  }

  private buildTicketPayload(ticketInput: Ticket | TicketItem) {
    // Normalizar a Ticket con items[]
    let ticket: Ticket;
    if (this.isLegacyTicket(ticketInput)) {
      ticket = {
        id: ticketInput.id,
        items: [
          {
            name: ticketInput.name,
            price: ticketInput.price,
            quantity: ticketInput.quantity,
            barcode: ticketInput.barcode,
          },
        ],
      };
    } else {
      ticket = ticketInput;
    }

    const lines: string[] = [];

    // Inicialización y encabezado
    lines.push("\x1B\x40"); // Init
    lines.push("\x1B\x74\x02"); // Codepage CP850
    lines.push("\x1B\x21\x30"); // Texto grande
    lines.push(`FOLIO: ${ticket.id}\n`);
    lines.push("\x1B\x21\x00"); // reset
    lines.push("----------------------------\n");

    lines.push("CLAVE  CANTIDAD  PRECIO\n");
    lines.push("----------------------------\n");
    // Detalle de items
    let total = 0;
    ticket.items.forEach((it) => {
      const line = `${it.name}\n  ${it.quantity}\n $${it.price.toFixed(2)}\n`;
      lines.push(line);
      total += it.price * it.quantity;
      if (it.barcode) {
        lines.push("\n");
        lines.push("\x1D\x6B\x05");
        lines.push(it.barcode);
        lines.push("\x00");
        lines.push("\n");
      }

      lines.push("----------------------------\n");
    });

    // Footer con total y corte
    lines.push("\x1A\x21\x30"); // Texto grande
    lines.push(`TOTAL MXN $${total.toFixed(2)}\n\n`);
    lines.push("\x1B\x21\x00");
    lines.push("¡Gracias por su compra!\n");
    lines.push("\x1D\x56\x41\x00"); // Cortar papel

    return lines.join("");
  }

  async printToSerial(
    ticketInput: Ticket | TicketItem,
    portRef: any
  ): Promise<boolean | string> {
    if (!portRef?.current) {
      return "Conecta la impresora primero";
    }
    try {
      const payload = this.buildTicketPayload(ticketInput);
      const writer = portRef.current.writable?.getWriter();
      if (!writer) {
        return "No se puede obtener writer de la impresora";
      }
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(payload));
      try {
        await writer.releaseLock();
      } catch {
        // ignore
      }
      return true;
    } catch (err) {
      console.error("Error al imprimir:", err);
      return "Error al imprimir - " + (err as Error).message;
    }
  }
}

// Nuevos tipos para tickets con múltiples productos
export interface TicketProduct {
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}
export interface Ticket {
  id: number;
  items: TicketProduct[];
}
