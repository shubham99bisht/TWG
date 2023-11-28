import { readData, searchReports } from "./helpers.js";

// Global Variables
let programs = {}, university_summary = {}

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

  let csvContent = 'University,Pending Payables, Pending Receivables\r\n';
  const csvRow = '{},{},{}\r\n';
  
  readData("universities")
    .then((university) => {
      // console.log(university)
      Object.keys(university).forEach(uid => {
        try {
          const data = university[uid]
          let payable = university_summary[uid]?.payable || 0
          let receivable = university_summary[uid]?.receivable || 0;

          const newRow = tableBody.insertRow();
          newRow.innerHTML = `<td class="name white-space-nowrap">${data.name}</td>
            <td class="payable">${payable}</td>
            <td class="receivable">${receivable}</td>`;
          newRow.innerHTML += isAgent ? `` :
            `<td class="text-end white-space-nowrap"><a class="btn btn-primary btn-sm" href="university_details.html?id=${uid}">More Details</a></td>`

          const name =  data.name.includes(',') ? `"${data.name}"` : data.name
          csvContent += csvRow.format(name, payable, receivable)
        } catch (e) {
          console.log(e)
        }
      })

      window.csvContent = csvContent
      listInit()
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr class="text-center"><td colspan="4">Error reading Universities</td></tr>`
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

  const payables = await searchReports({status: 'pending', reportType: 'payable'})
  const receivables = await searchReports({status: 'pending', reportType: 'receivable'})

  payables.map(tr => {
    const uid = tr.university
    if (!university_summary[uid]) {
      university_summary[uid] = { payable: 0, receivable: 0 };
    }
    university_summary[uid].payable += 1;
  })
  receivables.map(tr => {
    const uid = tr.university
    if (!university_summary[uid]) {
      university_summary[uid] = { payable: 0, receivable: 0 };
    }
    university_summary[uid].receivable += 1;
  })
  console.log(university_summary)
  listAll()
}
