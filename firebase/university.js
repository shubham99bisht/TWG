import { readData, fetchPaymentDetails } from "./helpers.js";

// Global Variables
let programs = {}

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
          const programName = programs[programType.type]?.name
          programType.paymentStages.forEach(paymentStage => {
            const newRow = tableBody.insertRow();
            newRow.innerHTML = `
              <td><a href="university_details.html?id=${uid}">${data.name}</a></td>
              <td>${programName}</td>
              <td>${paymentStage.stage}</td>
              <td>
                ${paymentStage.commissions[0].value}${paymentStage.commissions[0].type == 'percentage' ? '%' : ''}
                <br> ${paymentStage.commissions[0].installmentDays} days
              </td>
              <td>
                ${paymentStage.commissions[1].value}${paymentStage.commissions[1].type == 'percentage' ? '%' : ''}
                <br> ${paymentStage.commissions[1].installmentDays} days
              </td>`;
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

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async () => {
  programs = await readData("program_types")
  listAll()
}
