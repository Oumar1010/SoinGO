import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Visit {
  dateHeure: string;
  duree: number;
  statut: string;
  notes?: string;
  patient?: { nom: string; address_raw: string; telephone?: string; access_info?: string };
  aideSoignant?: { nom: string };
}

const STATUS_FR: Record<string, string> = {
  PLANIFIE:  'Planifié',
  EN_COURS:  'En cours',
  TERMINE:   'Terminé',
  ANNULE:    'Annulé',
};

export function exportTourneePDF(date: string, visits: Visit[], aideSoignantNom?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── En-tête ──────────────────────────────────────────────
  doc.setFillColor(45, 140, 255); // #2D8CFF
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SoinGo', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fiche de tournée', 14, 20);

  // Date en haut à droite
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const dateStr = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  doc.text(dateStr, 196, 12, { align: 'right' });

  if (aideSoignantNom) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Aide-soignant : ${aideSoignantNom}`, 196, 20, { align: 'right' });
  }

  // ── Résumé ────────────────────────────────────────────────
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const terminees = visits.filter(v => v.statut === 'TERMINE').length;
  const totalMin  = visits.reduce((acc, v) => acc + (v.duree || 0), 0);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  doc.setFillColor(245, 246, 250); // neutral
  doc.roundedRect(14, 33, 182, 16, 3, 3, 'F');
  doc.text(`${visits.length} visite(s)   ·   ${terminees} terminée(s)   ·   Durée totale : ${h}h${m > 0 ? m + 'min' : ''}`, 20, 43);

  // ── Tableau des visites ───────────────────────────────────
  const rows = visits.map((v, i) => [
    String(i + 1),
    new Date(v.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    v.patient?.nom || '—',
    v.patient?.address_raw || '—',
    `${v.duree} min`,
    STATUS_FR[v.statut] || v.statut,
    v.patient?.access_info || '',
    v.notes || '',
  ]);

  autoTable(doc, {
    startY: 54,
    head: [['#', 'Heure', 'Patient', 'Adresse', 'Durée', 'Statut', 'Accès', 'Notes']],
    body: rows,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [45, 140, 255],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 246, 250],
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
    didDrawCell: (data) => {
      // Colorier la colonne statut
      if (data.column.index === 5 && data.section === 'body') {
        const statut = data.cell.raw as string;
        if (statut === 'Terminé')   doc.setTextColor(46, 204, 113);
        if (statut === 'En cours')  doc.setTextColor(255, 159, 67);
        if (statut === 'Annulé')    doc.setTextColor(220, 80, 80);
        if (statut === 'Planifié')  doc.setTextColor(45, 140, 255);
      }
    },
  });

  // ── Pied de page ─────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `SoinGo — Généré le ${new Date().toLocaleDateString('fr-FR')} — Page ${i}/${pageCount}`,
      105, 290, { align: 'center' }
    );
  }

  // ── Téléchargement ────────────────────────────────────────
  const filename = `soingo_tournee_${date}_${aideSoignantNom?.replace(/\s+/g, '_') || 'equipe'}.pdf`;
  doc.save(filename);
}
