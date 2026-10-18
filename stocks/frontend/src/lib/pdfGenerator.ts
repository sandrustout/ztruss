import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captures an HTML invoice element and triggers a crisp, high-resolution A4 PDF download.
 */
export async function downloadElementAsPDF(
  element: HTMLElement, 
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2, // 2x device pixel ratio for crisp typography and lines
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // Additional pages if receipt content spans multiple pages
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
