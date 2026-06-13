export class CFDIParser {
  // Método principal público
  parse(xml: string): any {
    // 1. Limpieza básica: eliminar saltos de línea excesivos y normalizar
    const cleanXml = xml.replace(/\r?\n/g, " ").replace(/\s+/g, " ");

    // ----- 1. Datos del Comprobante -----
    const comprobanteMatch = cleanXml.match(/<cfdi:Comprobante\s+([^>]*?)\s*>/);
    if (!comprobanteMatch)
      throw new Error("No se encontró el nodo Comprobante");
    const comprobanteAttrs = this.extractAttributes(comprobanteMatch[1]);
    const comprobante = {
      version: comprobanteAttrs.Version || "",
      serie: (comprobanteAttrs.Serie || "").trim(),
      folio: comprobanteAttrs.Folio || "",
      fecha: comprobanteAttrs.Fecha || "",
      formaPago: comprobanteAttrs.FormaPago || "",
      metodoPago: comprobanteAttrs.MetodoPago || "",
      subTotal: parseFloat(comprobanteAttrs.SubTotal || "0"),
      total: parseFloat(comprobanteAttrs.Total || "0"),
      moneda: comprobanteAttrs.Moneda || "",
      tipoCambio: parseFloat(comprobanteAttrs.TipoCambio || "1"),
      tipoDeComprobante: comprobanteAttrs.TipoDeComprobante || "",
      lugarExpedicion: comprobanteAttrs.LugarExpedicion || "",
      exportacion: comprobanteAttrs.Exportacion || "",
    };

    // ----- 2. Emisor -----
    const emisorMatch = cleanXml.match(/<cfdi:Emisor\s+([^>]*?)\s*\/>/);
    const emisor = emisorMatch ? this.extractAttributes(emisorMatch[1]) : {};
    const emisorData = {
      rfc: (emisor.Rfc || "").trim(),
      nombre: (emisor.Nombre || "").replace(/Ã‘/g, "Ñ").replace(/Ã±/g, "ñ"),
      regimenFiscal: emisor.RegimenFiscal || "",
    };

    // ----- 3. Receptor -----
    const receptorMatch = cleanXml.match(/<cfdi:Receptor\s+([^>]*?)\s*\/>/);
    const receptor = receptorMatch
      ? this.extractAttributes(receptorMatch[1])
      : {};
    const receptorData = {
      rfc: (receptor.Rfc || "").trim(),
      nombre: (receptor.Nombre || "").trim(),
      usoCFDI: receptor.UsoCFDI || "",
      domicilioFiscalReceptor: receptor.DomicilioFiscalReceptor || "",
      regimenFiscalReceptor: receptor.RegimenFiscalReceptor || "",
    };

    // ----- 4. Conceptos (artículos) -----
    const conceptos: any[] = [];
    const conceptosBlock = this.getContentBetween(
      cleanXml,
      "<cfdi:Conceptos>",
      "</cfdi:Conceptos>",
    );
    if (conceptosBlock) {
      const conceptoRegex =
        /<cfdi:Concepto\s+([^>]*?)(?:>([\s\S]*?)<\/cfdi:Concepto>|\s*\/>)/g;
      let concMatch;
      while ((concMatch = conceptoRegex.exec(conceptosBlock)) !== null) {
        const attrs = this.extractAttributes(concMatch[1]);
        const innerXml = concMatch[2] || "";
        let impuestos: any = { traslados: [], retenciones: [] };
        if (innerXml) {
          const impuestosBlock = this.getContentBetween(
            innerXml,
            "<cfdi:Impuestos>",
            "</cfdi:Impuestos>",
          );
          if (impuestosBlock) {
            impuestos = this.parseImpuestos(impuestosBlock);
          }
        }
        conceptos.push({
          claveProdServ: attrs.ClaveProdServ || "",
          noIdentificacion: attrs.NoIdentificacion || "",
          cantidad: parseFloat(attrs.Cantidad || "0"),
          claveUnidad: attrs.ClaveUnidad || "",
          unidad: attrs.Unidad || "",
          descripcion: (attrs.Descripcion || "").trim(),
          valorUnitario: parseFloat(attrs.ValorUnitario || "0"),
          importe: parseFloat(attrs.Importe || "0"),
          objetoImp: attrs.ObjetoImp || "",
          impuestos,
        });
      }
    }

    // ----- 5. Impuestos globales -----
    let impuestosGlobales = {
      totalImpuestosRetenidos: 0,
      totalImpuestosTrasladados: 0,
      retenciones: [] as any[],
      traslados: [] as any[],
    };
    const impuestosGlobalMatch = cleanXml.match(
      /<cfdi:Impuestos\s+([^>]*?)>([\s\S]*?)<\/cfdi:Impuestos>/,
    );
    if (impuestosGlobalMatch) {
      const attrs = this.extractAttributes(impuestosGlobalMatch[1]);
      impuestosGlobales.totalImpuestosRetenidos = parseFloat(
        attrs.TotalImpuestosRetenidos || "0",
      );
      impuestosGlobales.totalImpuestosTrasladados = parseFloat(
        attrs.TotalImpuestosTrasladados || "0",
      );

      const innerImp = impuestosGlobalMatch[2];
      const retGlobalSection = this.getContentBetween(
        innerImp,
        "<cfdi:Retenciones>",
        "</cfdi:Retenciones>",
      );
      if (retGlobalSection) {
        const retRegex = /<cfdi:Retencion\s+([^>]*?)\s*\/>/g;
        let rMatch;
        while ((rMatch = retRegex.exec(retGlobalSection)) !== null) {
          const rAttrs = this.extractAttributes(rMatch[1]);
          impuestosGlobales.retenciones.push({
            impuesto: rAttrs.Impuesto || "",
            importe: parseFloat(rAttrs.Importe || "0"),
          });
        }
      }
      const trasGlobalSection = this.getContentBetween(
        innerImp,
        "<cfdi:Traslados>",
        "</cfdi:Traslados>",
      );
      if (trasGlobalSection) {
        const trasRegex = /<cfdi:Traslado\s+([^>]*?)\s*\/>/g;
        let tMatch;
        while ((tMatch = trasRegex.exec(trasGlobalSection)) !== null) {
          const tAttrs = this.extractAttributes(tMatch[1]);
          impuestosGlobales.traslados.push({
            impuesto: tAttrs.Impuesto || "",
            tipoFactor: tAttrs.TipoFactor || "",
            tasaOCuota: parseFloat(tAttrs.TasaOCuota || "0"),
            importe: parseFloat(tAttrs.Importe || "0"),
            base: parseFloat(tAttrs.Base || "0"),
          });
        }
      }
    }

    // ----- 6. Timbre Fiscal (Complemento) -----
    let timbreFiscal = {
      version: "",
      uuid: "",
      fechaTimbrado: "",
      rfcProvCertif: "",
      selloCFD: "",
      noCertificadoSAT: "",
      selloSAT: "",
    };
    const complementoBlock = this.getContentBetween(
      cleanXml,
      "<cfdi:Complemento>",
      "</cfdi:Complemento>",
    );
    if (complementoBlock) {
      const tfdMatch = complementoBlock.match(
        /<tfd:TimbreFiscalDigital\s+([^>]*?)\s*\/>/,
      );
      if (tfdMatch) {
        const tfdAttrs = this.extractAttributes(tfdMatch[1]);
        timbreFiscal = {
          version: tfdAttrs.Version || "",
          uuid: tfdAttrs.UUID || "",
          fechaTimbrado: tfdAttrs.FechaTimbrado || "",
          rfcProvCertif: (tfdAttrs.RfcProvCertif || "").trim(),
          selloCFD: tfdAttrs.SelloCFD || "",
          noCertificadoSAT: tfdAttrs.NoCertificadoSAT || "",
          selloSAT: tfdAttrs.SelloSAT || "",
        };
      }
    }

    // ----- Construir objeto final -----
    return {
      ...comprobante,
      emisor: emisorData,
      receptor: receptorData,
      conceptos,
      impuestos: impuestosGlobales,
      timbreFiscal,
    };
  }

  // Método privado: extraer atributos de un tag
  private extractAttributes(tagOpen: string): Record<string, string> {
    const attrRegex = /([a-zA-Z0-9_:]+)\s*=\s*["']([^"']*)["']/g;
    const attrs: Record<string, string> = {};
    let match;
    while ((match = attrRegex.exec(tagOpen)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  }

  // Método privado: obtener contenido entre dos etiquetas
  private getContentBetween(
    text: string,
    openTag: string,
    closeTag: string,
  ): string {
    const startIdx = text.indexOf(openTag);
    if (startIdx === -1) return "";
    let endIdx = text.indexOf(closeTag, startIdx + openTag.length);
    if (endIdx === -1) return "";
    return text.substring(startIdx + openTag.length, endIdx);
  }

  // Método privado: parsear impuestos de un concepto
  private parseImpuestos(impuestosStr: string): {
    traslados: any[];
    retenciones: any[];
  } {
    const traslados: any[] = [];
    const retenciones: any[] = [];

    const trasladosSection = this.getContentBetween(
      impuestosStr,
      "<cfdi:Traslados>",
      "</cfdi:Traslados>",
    );
    if (trasladosSection) {
      const trasladoRegex = /<cfdi:Traslado\s+([^>]*?)\s*\/>/g;
      let match;
      while ((match = trasladoRegex.exec(trasladosSection)) !== null) {
        const attrs = this.extractAttributes(match[1]);
        traslados.push({
          base: parseFloat(attrs.Base || "0"),
          impuesto: attrs.Impuesto || "",
          tipoFactor: attrs.TipoFactor || "",
          tasaOCuota: parseFloat(attrs.TasaOCuota || "0"),
          importe: parseFloat(attrs.Importe || "0"),
        });
      }
    }

    const retencionesSection = this.getContentBetween(
      impuestosStr,
      "<cfdi:Retenciones>",
      "</cfdi:Retenciones>",
    );
    if (retencionesSection) {
      const retencionRegex = /<cfdi:Retencion\s+([^>]*?)\s*\/>/g;
      let match;
      while ((match = retencionRegex.exec(retencionesSection)) !== null) {
        const attrs = this.extractAttributes(match[1]);
        retenciones.push({
          base: parseFloat(attrs.Base || "0"),
          impuesto: attrs.Impuesto || "",
          tipoFactor: attrs.TipoFactor || "",
          tasaOCuota: parseFloat(attrs.TasaOCuota || "0"),
          importe: parseFloat(attrs.Importe || "0"),
        });
      }
    }

    return { traslados, retenciones };
  }
}
