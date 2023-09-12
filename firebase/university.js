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
  const userRole = localStorage.getItem("userRole")
  const isAgent = userRole == 'Agent' ? true : false
  tableBody.innerHTML = ''
  readData("universities")
    .then((university) => {
      console.log(university)
      Object.keys(university).forEach(uid => {
        const data = university[uid]
        data.programTypes?.forEach(programType => {
          const programName = programs[programType.type]?.name
          programType.paymentStages?.forEach(paymentStage => {
            const newRow = tableBody.insertRow();
            newRow.innerHTML = isAgent ? `<td class="name">${data.name}</td>` :
              `<td class="name"><a href="university_details.html?id=${uid}">${data.name}</a></td>`
            newRow.innerHTML += `
              <td class="program_type">${programName}</td>
              <td class="payment_stage">${paymentStage.stage}</td>
              <td class="payable">
                ${paymentStage.commissions[0].value}${paymentStage.commissions[0].type == 'percentage' ? '%' : ''}
                <br> ${paymentStage.commissions[0].installmentDays} days
              </td>`;
            
            newRow.innerHTML += isAgent ? `<td class="receivable">-</td>` :
              `<td class="receivable">
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
        tableBody.innerHTML = `<tr class="text-center"><td colspan="5">Error reading Universities</td></tr>`
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
