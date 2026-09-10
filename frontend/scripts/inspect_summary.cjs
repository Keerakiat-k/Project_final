const ExcelJS = require('exceljs');

async function inspectSummarySheet() {
  const filePath = 'c:/Users/keerakiat.k/Desktop/ascg_g/IT Report 08-2026.xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  for (const name of ['Summary', 'Helpdesk&Support']) {
    const sheet = workbook.getWorksheet(name);
    console.log(`\n========================================`);
    console.log(`SHEET DETAILS: "${sheet.name}"`);
    console.log(`========================================`);
    
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowVals = [];
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        let val = cell.value;
        if (val && typeof val === 'object') {
          if (val.result !== undefined) val = val.result;
          else if (val.richText) val = val.richText.map(t => t.text).join('');
          else val = JSON.stringify(val);
        }
        rowVals.push(`C${colNumber}: "${val}"`);
      });
      console.log(`Row ${rowNumber}: ${rowVals.join(' | ')}`);
    });
  }
}

inspectSummarySheet().catch(err => console.error(err));
