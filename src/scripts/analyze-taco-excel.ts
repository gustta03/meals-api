import XLSX from "xlsx";

const filePath = "/home/gustavo/Downloads/Taco-4a-Edicao.xlsx";
const workbook = XLSX.readFile(filePath);

console.log("Sheets:", workbook.SheetNames);

const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

console.log("\nTrying with header row 2:");
const dataWithHeader2 = XLSX.utils.sheet_to_json(firstSheet, { 
  header: 2,
  defval: null,
  range: 2
});

console.log("Total rows:", dataWithHeader2.length);
console.log("\nFirst row:");
console.log(JSON.stringify(dataWithHeader2[0], null, 2));
console.log("\nSecond row:");
console.log(JSON.stringify(dataWithHeader2[1], null, 2));
console.log("\nThird row:");
console.log(JSON.stringify(dataWithHeader2[2], null, 2));

console.log("\n\nKeys in first row:");
if (dataWithHeader2[0]) {
  console.log(Object.keys(dataWithHeader2[0]));
}
