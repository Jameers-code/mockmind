import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportOptions {
  filename?: string;
  title?: string;
}

export async function exportToPDF(
  elementId: string,
  options: ExportOptions = {}
) {
  const {
    filename = `MockMind-Report-${new Date().toISOString().split("T")[0]}.pdf`,
    title = "MockMind Interview Report",
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 30;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 30;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("PDF export failed:", error);
    throw new Error("Failed to export PDF. Please try again.");
  }
}
