import { readData, writeDataWithNewId, updateData, deleteData } from "./helpers.js";

let program_types = {}

window.onload = async function() {
  program_types = await readData("program_types")
  listAll();
};


/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAll() {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ''
  readData("universities")
    .then((university) => {
      console.log(university)
      Object.keys(university).forEach(uid => {
        const data = university[uid]
        data.programTypes.forEach(programType => {
          programType.paymentStages.forEach(paymentStage => {
            const newRow = tableBody.insertRow();
            newRow.innerHTML = `
              <td>${data.name}</td>
              <td>${programType.type}</td>
              <td>${paymentStage.stage}</td>
              <td>${paymentStage.commissions[0].type} ${paymentStage.commissions[0].value}</td>
              <td>${paymentStage.commissions[1].type} ${paymentStage.commissions[1].value}</td>
              <td></td>`;
          });
        });
      })
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr class="text-center"><td colspan="3">Error reading Universities</td></tr>`
    });
}
window.listAll = listAll
