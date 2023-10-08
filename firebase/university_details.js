import { readData, fetchPaymentDetails, updateData } from "./helpers.js";
import { auth } from "./index.js";

let programs = {}, students = {}, agents = {}, paymentStages = {}
let university = {}, currencies = {}

/**
 * --------------------------------------------------
 * Update University Basic details
 * --------------------------------------------------
 */

const basicInfoModal = document.getElementById('update-basicinfo-modal')
const basicInfoForm = document.getElementById('basicInfoForm')
if (basicInfoModal) {
  basicInfoModal.addEventListener('show.bs.modal', event => {
    basicInfoForm.querySelector('#universityId').value = university.id
    basicInfoForm.querySelector('#name').value = university.name
    basicInfoForm.querySelector('#poc').value = university.poc
    basicInfoForm.querySelector('#email').value = university.email

    for (let i=1; i <= 5; i++) {
      basicInfoForm.querySelector(`#email${i}`).value = university.accounts?.[`email${i}`] || ''
      basicInfoForm.querySelector(`#usage${i}`).value  = university.accounts?.[`usage${i}`] || ''
    }

  })
}

function updateBasicInfo() {
  try {
    const formProps = new FormData(basicInfoForm);
    const formData = Object.fromEntries(formProps);
    const { universityId: id, name, poc, email,
      email1, usage1, email2, usage2, email3, usage3, email4, usage4, email5, usage5
    } = formData
    if (!name || !poc || !email) {
      failMessage("Enter all details"); return
    }
    updateData(`universities/${id}`, { name, poc, email, accounts: {
      email1, usage1, email2, usage2, email3, usage3, email4, usage4, email5, usage5
    }})
    successMessage("Updated University details").then(() => location.reload())
  } catch(e) {
    console.log(e);
    failMessage("Failed to updated university details.");
  }
}
window.updateBasicInfo = updateBasicInfo

/**
 * --------------------------------------------------
 * Update Commission details
 * --------------------------------------------------
 */

const commissionsModal = document.getElementById('commissions-modal')
const commissionsForm = document.getElementById('commissionsForm')
if (commissionsModal) {
  const Pcurrency = commissionsForm.querySelector('#Pcurrency')
  const Pvalue = commissionsForm.querySelector('#Pvalue')
  const Pinstallment = commissionsForm.querySelector('#Pinstallment')
  const Rcurrency = commissionsForm.querySelector('#Rcurrency')
  const Rvalue = commissionsForm.querySelector('#Rvalue')
  const Rinstallment = commissionsForm.querySelector('#Rinstallment')

  commissionsModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const row = button.closest('tr')
    if (row) {
      const program_type_id = row.querySelector('.program').id
      const payment_stage_id = row.querySelector('.stage').id

      const programType = university.programTypes.find(pt => pt.type === program_type_id);
      const paymentStage = programType.paymentStages.find(ps => ps.stage === payment_stage_id);
      const commissions = paymentStage.commissions

      commissionsForm.querySelector('#universityId').value = university.id
      commissionsForm.querySelector('#program_type').value = program_type_id
      commissionsForm.querySelector('#program_type').disabled = true
      commissionsForm.querySelector('#payment_stage').value = payment_stage_id
      commissionsForm.querySelector('#payment_stage').disabled = true

      commissionsForm.querySelector('#Ptype').value = commissions[0].type
      Pvalue.value = commissions[0].value
      Pinstallment.value = commissions[0].installmentDays
      if (commissions[0].type == 'fixed') {
        Pcurrency.required = true; Pcurrency.disabled = false; Pcurrency.hidden = false;
        Pcurrency.value = commissions[0].currency
        Pvalue.disabled = false; Pinstallment.disabled = false  
      } else if (commissions[0].type == 'percentage') {
        Pcurrency.required = false; Pcurrency.disabled = true; Pcurrency.hidden = true;
        Pvalue.disabled = false; Pinstallment.disabled = false  
      } else {
        Pcurrency.required = false; Pcurrency.disabled = true; Pcurrency.hidden = true;
        Pvalue.disabled = true; Pinstallment.disabled = true
        Pvalue.value = ''; Pinstallment.value = ''
      }

      commissionsForm.querySelector('#Rtype').value = commissions[1].type
      Rvalue.value = commissions[1].value
      Rinstallment.value = commissions[1].installmentDays
      if (commissions[1].type == 'fixed') {
        Rcurrency.required = true; Rcurrency.disabled = false; Rcurrency.hidden = false;
        Rcurrency.value = commissions[1].currency
        Rvalue.disabled = false; Rinstallment.disabled = false  
      } else if (commissions[1].type == 'percentage') {
        Rcurrency.required = false; Rcurrency.disabled = true; Rcurrency.hidden = true;
        Rvalue.disabled = false; Rinstallment.disabled = false  
      } else {
        Rcurrency.required = false; Rcurrency.disabled = true; Rcurrency.hidden = true;
        Rvalue.disabled = true; Rinstallment.disabled = true  
        Rvalue.value = ''; Rinstallment.value = ''  
      }    
    } else {
      commissionsForm.reset()
      Pcurrency.required = true; Pcurrency.disabled = false; Pcurrency.hidden = false;
      Rcurrency.required = true; Rcurrency.disabled = false; Rcurrency.hidden = false;
      commissionsForm.querySelector('#universityId').value = university.id
    }
  })
}

function updateCommission() {
  try {
    const formProps = new FormData(commissionsForm);
    const formData = Object.fromEntries(formProps);
    const { Ptype, Pvalue, Pcurrency, Pinstallment, Rtype, Rvalue, Rcurrency, Rinstallment } = formData
    const id = commissionsForm.querySelector('#universityId').value
    const program_type = commissionsForm.querySelector('#program_type').value 
    const payment_stage = commissionsForm.querySelector('#payment_stage').value
    
    if (!id || !program_type || !payment_stage ||
      !Ptype || !Pvalue || !Pinstallment || !Rtype || !Rvalue || !Rinstallment
    ) {
      failMessage("Enter all details"); return
    }

    if ((Ptype == 'Percentage' && (Pvalue < 1 || Pvalue > 100)) ||
      (Rtype == 'Percentage' && (Rvalue < 1 || Rvalue > 100))
    ) { failMessage("Percentage value should in range 1-100"); return }

    const commissions = [
      {type: Ptype, value: Pvalue, installmentDays: Pinstallment},
      {type: Rtype, value: Rvalue, installmentDays: Rinstallment}
    ]

    if (commissions[0].type == 'fixed') commissions[0]['currency'] = Pcurrency
    if (commissions[1].type == 'fixed') commissions[1]['currency'] = Rcurrency

    // Find the programType with the matching "type" value
    const programType = university.programTypes.find(pt => pt.type === program_type);
    if (programType) {
      // Find the paymentStage with the matching "stage" value within the programType
      const paymentStage = programType.paymentStages.find(ps => ps.stage === payment_stage);
      if (paymentStage) {
        paymentStage.commissions = commissions
      } else {
        programType.paymentStages.push({ stage: payment_stage, commissions });
      }
    } else {
      university.programTypes.push({
        type: program_type, paymentStages: [{ stage: payment_stage, commissions }]
      });
    }

    updateData(`universities/${id}`, university)
    successMessage("Updated University commission details").then(() => location.reload())
  } catch(e) {
    console.log(e);
    failMessage("Failed to updated university commission details.");
  }
}
window.updateCommission = updateCommission

function removeCommissionEntry(event) {
  try {
    const button = event.target
    const row = button.closest('tr')
    const program_type = row.querySelector('.program').id
    const payment_stage = row.querySelector('.stage').id
    if (!row || !program_type || !payment_stage) return

    if (university.programTypes.length <= 1) {
      failMessage("University needs atleast one commission entry")
      return
    }

    if (confirm("Are you sure to remove this commission entry?")) {
    
      const programTypeIndex = university.programTypes.findIndex(pt => pt.type === program_type);
      if (programTypeIndex !== -1) {
        const programType = university.programTypes[programTypeIndex];
        const paymentStageIndex = programType.paymentStages.findIndex(ps => ps.stage === payment_stage);
        if (paymentStageIndex !== -1) {
          programType.paymentStages.splice(paymentStageIndex, 1);
    
          // If there are no more paymentStages under the programType, remove the programType as well
          if (programType.paymentStages.length === 0) {
            university.programTypes.splice(programTypeIndex, 1);
          }
        }
      }
      updateData(`universities/${university.id}`, university)
      successMessage("Removed University commission details").then(() => location.reload())
    }
  } catch(e) {
    console.log(e);
    failMessage("Failed to remove university commission details.");
  }
}
window.removeCommissionEntry = removeCommissionEntry

function commissionTypeChange(event) {
  const select = event.target 
  const selectId = select.id[0]
  const row = select.closest('.row')
  console.log(select, selectId, row)
  const currency = row.querySelector(`#${selectId}currency`)
  const rate = row.querySelector(`#${selectId}value`)
  const days = row.querySelector(`#${selectId}installment`)

  if (select.value == 'fixed') {
    currency.required = true
    currency.disabled = false
    currency.hidden = false
    rate.disabled = false
    days.disabled = false    
  } else if (select.value == 'percentage') {
    currency.required = false
    currency.disabled = true
    currency.hidden = true
    rate.disabled = false
    days.disabled = false    
  } else {
    currency.required = false
    currency.disabled = true
    currency.hidden = true
    rate.disabled = true
    days.disabled = true    
  }
}
window.commissionTypeChange = commissionTypeChange

/**
 * --------------------------------------------------
 * Display University details
 * --------------------------------------------------
 */

function listOne(id) {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ''

  readData(`universities/${id}`)
    .then((data) => {
      // Update Global university
      university = {id, ...data}
      // Update info
      document.getElementById("universityId").innerHTML = id
      document.getElementById("poc").innerHTML = data?.poc || '-'
      document.getElementById("email").innerHTML = data?.email || '-'
      document.getElementById("name").innerHTML = data?.name

      for (let i=1; i <= 5; i++) {
        const row = document.getElementById(`account${i}`)
        const email = data.accounts?.[`email${i}`] || '-'
        const usage = data.accounts?.[`usage${i}`] || '-'
        row.innerHTML = `<td>${email}</td><td>${usage}</td>`
      }

      data.programTypes.forEach(programType => {
        const programName = programs[programType.type]?.name
        programType.paymentStages.forEach(paymentStage => {
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
          newRow.innerHTML = `
            <td class="university">${data.name}</td>
            <td class="program" id="${programType.type}">${programName}</td>
            <td class="stage" id="${paymentStage.stage}">${stageName}</td>
            <td class="payable">
              ${payable} <br> ${paymentStage.commissions[0]?.installmentDays || 0} days
            </td>
            <td class="receivable">
              ${receivable} <br> ${paymentStage.commissions[1]?.installmentDays || 0} days
            </td>
            <td>
              <a data-bs-toggle="modal" data-bs-target="#commissions-modal" class="pe-2" type="button"><i class="fas fa-edit text-warning"></i></a>
              <a onclick="removeCommissionEntry(event)" type="button"><i class="fas fa-trash text-danger"></i></a>
            </td>`;
        });
      });
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="6">Error reading University details</td></tr>`
    });
}
window.listOne = listOne

async function readPaymentDetails(id) {
  const data = await fetchPaymentDetails('university', id)
  const payableBody = document.getElementById("table-payable-body");
  const receivableBody = document.getElementById("table-receivable-body");
  await updatePayables(payableBody, data["Payable"])
  await updatePayables(receivableBody, data["Receivable"])
  listInit()
}
window.readPaymentDetails = readPaymentDetails

async function updatePayables(tableBody, payables) {
  tableBody.innerHTML = ''
  const schema = `<tr class="btn-reveal-trigger">
    <td class="align-middle white-space-nowrap student"><a href="student_details.html?id={}">{}</a></td>
    <td class="align-middle white-space-nowrap university"><a href="university_details.html?id={}">{}</a></td>
    <td class="align-middle white-space-nowrap agent"><a href="agent.html?id={}">{}</a></td>
    <td class="align-middle stage">{}</td>
    <td class="align-middle text-nowrap fees">{}</td>
    <td class="align-middle text-nowrap amount">{}</td>
    <td class="align-middle text-nowrap duedate">{}</td>
    <td class="align-middle fs-0 white-space-nowrap status text-center">
      {}
    </td>
  </tr>`

  const promises = Object.keys(payables).map(async id => {
    const p = payables[id]
    const AgentName = agents[p.agent]?.name || ''
    const StudentName = students[p.student].studentName
    const UniversityName = university.name

    const stage = paymentStages[p.stage]
    let status = ''
    switch (p?.status) {
      case 'confirmed': {
        status = '<span class="badge badge rounded-pill badge-soft-success">Confirmed<span class="ms-1 fas fa-check" data-fa-transform="shrink-2"></span></span>'
        break
      }
      case 'invoiced': {
        status = '<span class="badge badge rounded-pill badge-soft-warning">Invoiced<span class="ms-1 fas fa-check" data-fa-transform="shrink-2"></span></span>'
        break
      }
      case 'paid': {
        status = '<span class="badge badge rounded-pill badge-soft-success">Paid<span class="ms-1 fas fa-check" data-fa-transform="shrink-2"></span></span>'
        break
      }
      case 'na': {
        status = '<span class="badge badge rounded-pill badge-soft-secondary">N/A<span class="ms-1 fas fa-ban" data-fa-transform="shrink-2"></span></span>'
        break
      }
      case 'pending':
      default: {
        status = '<span class="badge badge rounded-pill badge-soft-warning">Pending<span class="ms-1 fas fa-stream" data-fa-transform="shrink-2"></span></span>'
        break
      }
    }

    let amount = 'na'
    if (p.amount && p.currency) {
      amount = `${p.amount} ${currencies[p.currency].name}`
    } else if (p.amount) {
      amount = `${p.amount}%`
    }

    const row = schema.format(p.student, StudentName, p.university, UniversityName,
      p.agent, AgentName, stage.name, `${p.fees} ${currencies[p.feesCurrency].name}`, amount, p.dueDate, status)
    if (tableBody) tableBody.innerHTML += row
  });

  if (!Object.keys(payables).length) {
    tableBody.innerHTML = `<tr class="text-center"><td colspan="8">No payments data</td></tr>`
  }

  await Promise.all(promises)
}

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

async function fetchData() {
  programs = await readData("program_types")
  students = await readData("students")
  agents = await readData("agents")
  paymentStages = await readData("payment_stages")
  currencies = await readData("currency_types")
  console.log(currencies)

  updateSelectors()
  addProgramBtn.disabled = false
}

function updateSelectors() {
  const programTypeSelect = document.getElementById('program_type')
  Object.keys(programs).forEach(function (optionData) {
    const option = document.createElement('option');
    option.value = optionData;
    option.textContent = programs[optionData].name;
    programTypeSelect.appendChild(option);
  });

  const paymentStageSelect = document.getElementById('payment_stage')
  Object.keys(paymentStages).forEach(function (key) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = paymentStages[key].name;
    paymentStageSelect.appendChild(option);
  });  

  const Rcurrency = document.getElementById('Rcurrency')
  const Pcurrency = document.getElementById('Pcurrency')
  let currency_options = ''
  Object.keys(currencies).forEach(key => {
    currency_options += `<option value='${key}'>${currencies[key]?.name}</option>`
  })
  Pcurrency.innerHTML = currency_options
  Rcurrency.innerHTML = currency_options
} 

window.onload = async function () {
  await fetchData()
  const userRole = localStorage.getItem("userRole")
  if (!['Admin', 'Finance'].includes(userRole)) {
    location.href = 'universities.html'
  }

  const params = new URLSearchParams(document.location.search);
  const id = params.get('id')
  if (!id) location.href = "universities.html"
  listOne(id); 
  await readPaymentDetails(id);
  listInit()
} 
