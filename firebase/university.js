import { readData } from "./helpers.js";

// Global Variables
let programs = {}, currencies = {}, paymentStages = {}

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
        try {
          const data = university[uid]
          data.programTypes?.forEach(programType => {
            const programName = programs[programType.type]?.name
            programType.paymentStages?.forEach(paymentStage => {
              const stageName = paymentStages[paymentStage.stage].name

              let payable = 'NA'
              switch (paymentStage.commissions[0].type) {
                case 'fixed': {
                  const currency = currencies[paymentStage.commissions[0]?.currency].name
                  payable = `${paymentStage.commissions[0]?.value || '0'} ${currency}`
                  break;
                }
                case 'percentage': {
                  payable = `${paymentStage.commissions[0]?.value || '0'}%`
                  break;
                }
              }

              let receivable = 'NA'
              switch (paymentStage.commissions[1].type) {
                case 'fixed': {
                  const currency = currencies[paymentStage.commissions[1]?.currency].name
                  receivable = `${paymentStage.commissions[1]?.value || '0'} ${currency}`
                  break;
                }
                case 'percentage': {
                  receivable = `${paymentStage.commissions[1]?.value || '0'}%`
                  break;
                }
              }

              const newRow = tableBody.insertRow();
              newRow.innerHTML = isAgent ? `<td class="name">${data.name}</td>` :
                `<td class="name"><a href="university_details.html?id=${uid}">${data.name}</a></td>`
              newRow.innerHTML += `
                <td class="program_type">${programName}</td>
                <td class="payment_stage">${stageName}</td>
                <td class="payable">
                  ${payable} <br> ${paymentStage.commissions[0]?.installmentDays || 0} days
                </td>`;
              
              newRow.innerHTML += isAgent ? `<td class="receivable">-</td>` :
                `<td class="receivable">
                  ${receivable} <br> ${paymentStage.commissions[1]?.installmentDays || 0} days
                </td>`;
            });
          });
        } catch (e) {
          console.log(e)
        }
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
  currencies = await readData("currency_types")
  paymentStages = await readData("payment_stages")
  listAll()
}
