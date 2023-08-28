import { readData, writeDataWithNewId, updateData, deleteData } from "./helpers.js";

let program_types = {}

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
              <td><a href="university_details.html?id=${uid}">${data.name}</a></td>
              <td>${programType.type}</td>
              <td>${paymentStage.stage}</td>
              <td>${paymentStage.commissions[0].value}${paymentStage.commissions[0].type == 'percentage' ? '%' : ''}</td>
              <td>${paymentStage.commissions[1].value}${paymentStage.commissions[1].type == 'percentage' ? '%' : ''}</td>`;
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

function listOne() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get('id')
  if (!id) location.href = "universities.html"
  
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ''

  readData(`universities/${id}`)
    .then((data) => {
      console.log(data)
      document.getElementById("agentId").innerHTML = id
      document.getElementById("name").innerHTML = data?.name
      document.getElementById("accountName").innerHTML = data?.billing?.accountName
      document.getElementById("accountNumber").innerHTML = data?.billing?.accountNumber
      document.getElementById("bank").innerHTML = data?.billing?.bank
      document.getElementById("ifsc").innerHTML = data?.billing?.ifsc
      data.programTypes.forEach(programType => {
        programType.paymentStages.forEach(paymentStage => {
          const newRow = tableBody.insertRow();
          newRow.innerHTML = `
            <td>${data.name}</td>
            <td>${programType.type}</td>
            <td>${paymentStage.stage}</td>
            <td>${paymentStage.commissions[0].type} ${paymentStage.commissions[0].value}</td>
            <td>${paymentStage.commissions[1].type} ${paymentStage.commissions[1].value}</td>`;
        });
      });
      listInit()
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr class="text-center"><td colspan="3">Error reading Universities</td></tr>`
    });
}
window.listOne = listOne

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async function() {
  program_types = await readData("program_types")
  const pageName = window.location.pathname.split('/').pop().split(".html")[0];
  switch (pageName) {
    case 'universities': {
      listAll(); break;
    }
    case 'university_details': {
      listOne(); break;
    }
  }
};
