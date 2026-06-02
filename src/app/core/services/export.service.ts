import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  downloadJSON(data: any, filename: string) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    this.triggerDownload(dataStr, filename + '.json');
  }

  downloadCSV(dataArray: any[], filename: string, headers: string[], mapRow: (item: any) => any[]) {
    if (!dataArray || dataArray.length === 0) {
      alert("No hay datos para exportar a Excel/CSV.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    // Header PINBALL PRO
    csvContent += "PINBALL PRO - REPORTE DE SISTEMA\n";
    csvContent += `Fecha de Exportacion: ${new Date().toLocaleString()}\n`;
    csvContent += `Modulo: ${filename.toUpperCase()}\n\n`;

    // Table Headers
    csvContent += headers.join(",") + "\n";

    // Data Rows
    dataArray.forEach(item => {
      const row = mapRow(item);
      // Escape commas and quotes for CSV
      const csvRow = row.map(cell => {
        let text = String(cell || '');
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
          text = `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      });
      csvContent += csvRow.join(",") + "\n";
    });

    this.triggerDownload(csvContent, filename + '.csv');
  }

  private triggerDownload(dataUrl: string, filename: string) {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataUrl);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
