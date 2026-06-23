import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  private async getBase64ImageFromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  downloadJSON(data: any, filename: string) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    this.triggerDownload(dataStr, filename + '.json');
  }

  async downloadExcel(dataArray: any[], filename: string, title: string, headers: string[], mapRow: (item: any) => any[]) {
    if (!dataArray || dataArray.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    try {
      const base64Logo = await this.getBase64ImageFromUrl('logo.png');
      const imageId = workbook.addImage({
        base64: base64Logo,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 100, height: 100 }
      });
    } catch (e) {
      console.warn("Could not load logo for Excel", e);
    }

    // Leave space for the logo
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Add Title
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };
    worksheet.mergeCells(`A${titleRow.number}:${String.fromCharCode(64 + headers.length)}${titleRow.number}`);
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([`Fecha de Exportación: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    // Add Headers
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6366F1' } // accentPrimary (Indigo)
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add Data
    dataArray.forEach(item => {
      const row = worksheet.addRow(mapRow(item));
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLen = 10;
      column.eachCell!({ includeEmpty: true }, cell => {
        const len = cell.value ? cell.value.toString().length : 10;
        if (len > maxLen) maxLen = len;
      });
      column.width = maxLen < 30 ? maxLen + 2 : 30; // Cap width at 30
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }

  async downloadPDF(dataArray: any[], filename: string, title: string, headers: string[], mapRow: (item: any) => any[]) {
    if (!dataArray || dataArray.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    try {
      const base64Logo = await this.getBase64ImageFromUrl('logo.png');
      doc.addImage(base64Logo, 'PNG', 14, 10, 30, 30);
    } catch (e) {
      console.warn("Could not load logo for PDF", e);
    }

    // Title and metadata
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241); // accentPrimary
    doc.text(title, 50, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Exportación: ${new Date().toLocaleString()}`, 50, 28);
    doc.text(`Módulo: ${filename.toUpperCase()}`, 50, 34);

    const body = dataArray.map(item => mapRow(item));

    autoTable(doc, {
      startY: 45,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`${filename}.pdf`);
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
