// pdf-entry.js — bundled by build.sh into FFCalc.html.
// Exposes window.ffPDF with the jsPDF constructor and autotable applied.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

window.ffPDF = { jsPDF, autoTable };
