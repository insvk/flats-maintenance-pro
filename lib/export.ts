// lib/export.ts
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MaintenanceWithDetails, Tenant } from './supabase'
import { formatCurrency, getMonthYearString } from './utils'

export async function exportMaintenanceToWord(record: MaintenanceWithDetails) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Maintenance Record Report",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Period: ${getMonthYearString(record.month, record.year)}`,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Collector: ${record.collector_name}`,
        }),
        new Paragraph({
          text: `Grand Total: ${formatCurrency(record.grand_total)}`,
          bold: true,
        }),
        new Paragraph({
          text: "\nTenant Payments:",
          heading: HeadingLevel.HEADING_2,
        }),
        ...record.tenant_payments.map(tp => 
          new Paragraph({
            text: `${tp.tenant?.name}: ${formatCurrency(tp.amount)} - ${tp.status}`,
          })
        ),
        new Paragraph({
          text: "\nExpense Particulars:",
          heading: HeadingLevel.HEADING_2,
        }),
        ...record.particulars.map(p => 
          new Paragraph({
            text: `${p.item_name}: ${formatCurrency(p.price)} (${p.type})`,
          })
        ),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `maintenance-${record.month}-${record.year}.docx`)
}

export function exportMaintenanceToPDF(record: MaintenanceWithDetails) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Maintenance Record Report', 105, 15, { align: 'center' })

  doc.setFontSize(12)
  doc.text(`Period: ${getMonthYearString(record.month, record.year)}`, 20, 30)
  doc.text(`Collector: ${record.collector_name}`, 20, 40)
  doc.text(`Grand Total: ${formatCurrency(record.grand_total)}`, 20, 50)

  // Tenant Payments Table
  autoTable(doc, {
    startY: 60,
    head: [['Tenant', 'Amount', 'Status']],
    body: record.tenant_payments.map(tp => [
      tp.tenant?.name || '-',
      formatCurrency(tp.amount),
      tp.status
    ]),
  })

  // Particulars Table
  const finalY = (doc as any).lastAutoTable.finalY || 100
  autoTable(doc, {
    startY: finalY + 10,
    head: [['Item', 'Price', 'Type']],
    body: record.particulars.map(p => [
      p.item_name,
      formatCurrency(p.price),
      p.type
    ]),
  })

  doc.save(`maintenance-${record.month}-${record.year}.pdf`)
}

export function exportAllRecordsToPDF(records: MaintenanceWithDetails[]) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('All Maintenance Records', 105, 15, { align: 'center' })

  autoTable(doc, {
    startY: 25,
    head: [['Period', 'Collector', 'Grand Total']],
    body: records.map(r => [
      getMonthYearString(r.month, r.year),
      r.collector_name,
      formatCurrency(r.grand_total)
    ]),
  })

  doc.save(`all-maintenance-records.pdf`)
}
