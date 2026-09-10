const ExcelJS = require('exceljs');

async function inspectSummaryAndHelpdesk() {
  const filePath = 'c:/Users/keerakiat.k/Desktop/ascg_g/IT Report 08-2026.xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  for (const sheetName of ['Summary', 'Helpdesk&Support', 'Soi-10']) {
    const sheet = workbook.getWorksheet(sheetName);
    console.log(`\n========================================`);
    console.log(`FULL SHEET: "${sheet.name}"`);
    console.log(`========================================`);
    
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = [];
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        let val = '';
        try {
          if (cell.value && typeof cell.value === 'object') {
            if (cell.value.result !== undefined) val = cell.value.result;
            else if (cell.value.richText) val = cell.value.richText.map(t => t.text).join('');
            else val = JSON.stringify(cell.value);
          } else {
            val = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
          }
        } catch(e) { val = 'ERR'; }
        if (val) values.push(`C${colNumber}: "${val}"`);
      });
      if (values.length > 0) {
        console.log(`Row ${rowNumber}: ${values.join(' | ')}`);
      }
    });
  }
}

inspectSummaryAndHelpdesk().catch(err => console.error(err));
