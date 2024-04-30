import { readData, deleteData, fetchPaymentDetails, updateData, writeDataWithNewId } from "./helpers.js";

// Global Variables
let students = {}, universities = {}, agents = {}, programs = {}, payments = {}, studyStages = {}
let availablestudyStages = {}, currency = {}
let currency_options = ''

const currencyInput =  document.getElementById("currency")
const feesCurrencyInput =  document.getElementById("fees_currency")

async function fetchData() {
  programs = await readData("program_types")
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  currency = await readData("currency_types")
  studyStages = await readData("study_stages")
  Object.keys(currency).forEach(key => {
    currency_options += `<option value='${key}'>${currency[key]?.name}</option>`
  })
  if (currencyInput) {
    currencyInput.innerHTML = currency_options
    feesCurrencyInput.innerHTML = currency_options
  }
}

/**
 * --------------------------------------------------
 * Download CSV
 * --------------------------------------------------
 */

let downloadData = {
  "payable": {}, "receivable": {}
}

function downloadCommissions(type, downloadName = 'data') {
  if (!Object.keys(downloadData).includes(type)) return;
  
  let data = downloadData[type];
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", blobUrl);
  link.setAttribute("download", downloadName + ".csv");

  link.click();

  URL.revokeObjectURL(blobUrl);
}
window.downloadCommissions = downloadCommissions

/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllStudents() {
  const tableBody = document.getElementById("table-students-body");
  if (!tableBody) return
  readData("students")
    .then((students) => {
      tableBody.innerHTML = ''
      const schema = `<tr class="btn-reveal-trigger">
            <td class="id align-middle white-space-nowrap py-2">
              <a href="student_details.html?id={}">{}</a>
            </td>
            <td class="name align-middle white-space-nowrap py-2">
              <h5 class="mb-0 fs--1">{}</h5>
              {}
            </td>
            <td class="university align-middle white-space-nowrap py-2">{}</td>
            <td class="program align-middle py-2">{}</td>
            <td class="source align-middle py-2">{}</td>
            <td class="align-middle white-space-nowrap py-2 text-end">
                <div class="dropdown font-sans-serif position-static">
                    <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal" type="button" id="customer-dropdown-0" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false"><span class="fas fa-ellipsis-h fs--1"></span></button>
                    <div class="dropdown-menu dropdown-menu-end border py-0" aria-labelledby="customer-dropdown-0">
                        <div class="py-2">
                          <a class="dropdown-item" href="student_details.html?id={}">More Details</a>
                        </div>
                    </div>
                </div>
            </td>
        </tr>`

      let csvContent = 'Student,Email,University,Program,Source\r\n'
      const csvRow = '{},{},{},{},{}\r\n'

      Object.keys(students).forEach(id => {
        try {
          const s = students[id]
          const u = universities[s.university].name
          const p = programs[s.program_type].name
          let source = s.source
          if (source == 'Agent') {
            source += '<br>' + s.agent
          }

          const row_id = `LSQ: ${id}<br>Univ: ${s.universityStudentId}`
          const row = schema.format(id, row_id, s.studentName, s?.studentEmail || '-', u, p, source, id, id)
          if (tableBody) tableBody.innerHTML += row

          csvContent += csvRow.format(s.studentName, s?.studentEmail || '-', u, p, source)
        } catch (e) {
          console.log(e)
        }
      });

      window.csvContent = csvContent
      listInit()
    })
    .catch((error) => {
      console.error("Error reading students:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="6">Student data not found!</td></tr>`
    });
    closeSwal()
}
window.listAllStudents = listAllStudents

/**
 * --------------------------------------------------
 * Read Student with id
 * --------------------------------------------------
 */

function readStudentDetails(id) {
  readData(`students/${id}`)
    .then(async (result) => {
      students[id] = result
      if (!result) failMessage("Student not found!");

      const universityName = await readData(`universities/${result?.university}/name`)
      const programName = await readData(`program_types/${result?.program_type}/name`)

      document.getElementById("student_id").innerHTML = id
      document.getElementById("name").innerHTML = result?.studentName
      document.getElementById("university_id").innerHTML = result.universityStudentId
      document.getElementById("join_date").innerHTML = result?.joinDate
      document.getElementById("student_email").innerHTML = result?.studentEmail || '-'

      document.getElementById("university").innerHTML = universityName || ''
      document.getElementById("program_type").innerHTML = programName || ''
      document.getElementById("source").innerHTML = result?.source
      document.getElementById("agent").innerHTML = result?.agent || '-'

      closeSwal()
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error fetching agent");
    });
}
window.readStudentDetails = readStudentDetails

async function readPaymentDetails(id) {
  const userRole = localStorage.getItem("userRole")
  const isAgent = userRole == 'Agent' ? true : false

  const data = await fetchPaymentDetails('student', id)
  payments = data
  const payableBody = document.getElementById("table-payable-body");
  const receivableBody = document.getElementById("table-receivable-body");
  await updatePayables(payableBody, data["payable"], "payable")
  if (!isAgent) {
    await updatePayables(receivableBody, data["receivable"], "receivable")
  }
  listInit()
}
window.readPaymentDetails = readPaymentDetails

async function updatePayables(tableBody, payables, type) {
  tableBody.innerHTML = ''
  let deleteRow = localStorage.getItem("userRole") == 'Admin' ? 
    `<a class="dropdown-item text-danger" onclick="deleteTransaction('{}', '${type}')" style="cursor:pointer">Delete</a>` :
    ''

  const schema = `<tr class="btn-reveal-trigger" id="{}">
    <td class="align-middle white-space-nowrap student"><a href="student_details.html?id={}">{}</a></td>
    <td class="align-middle text-nowrap stage">{}</td>
    <td class="align-middle text-nowrap fees">{}</td>
    <td class="align-middle text-nowrap amount">{}</td>
    <td class="align-middle text-nowrap duedate">{}</td>
    <td class="align-middle notes">{}</td>
    <td class="align-middle fs-0 white-space-nowrap status text-center">{}</td>
    <td class="align-middle white-space-nowrap text-end">
      <div class="dropstart font-sans-serif position-static d-inline-block">
        <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal float-end" type="button" id="dropdown-recent-purchase-table-1" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false" data-bs-reference="parent"><span class="fas fa-ellipsis-h fs--1"></span></button>
        <div class="dropdown-menu dropdown-menu-end border py-2" aria-labelledby="dropdown-recent-purchase-table-1">
          <a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#edit-details" style="cursor:pointer">Edit</a>
          <a class="dropdown-item text-warning" data-bs-toggle="modal" data-bs-target="#update-status" style="cursor:pointer">Update Status</a>
          ${deleteRow}
        </div>
      </div>
    </td>    
  </tr>`

  let csvContent = 'Student,University,Agent,Study Stage,Fees,Amount,Due Date,Status,Notes\r\n';
  // student, univ, agent, program type, stage, fees, amount, due date, status, notes
  const csvRow = '{},{},{},{},{},{},{},{},{}\r\n'

  const promises = Object.keys(payables).map(async id => {
    try {
      const p = payables[id]
      const AgentName = agents && agents[p.agent]?.name || ''
      const StudentName = students[p.student].studentName
      const UniversityName = universities[p?.university].name
  
      const stage = studyStages[p.stage]
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

      let amount = 'N/A'
      if (p.amount && p.currency) {
        amount = `${p.amount} ${currency[p.currency].name}`
      } else if (p.amount) {
        amount = `${p.amount}%`
      }
  
      const row = schema.format(id, p.student, StudentName, 
        stage?.name || '', `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, p?.notes || '', status, id)
        if (tableBody) tableBody.innerHTML += row

      csvContent += csvRow.format(StudentName, UniversityName, AgentName, stage.name, `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, p?.status, p?.notes || '')
    } catch (e) {
      console.log(e)
    }
  });

  if (!Object.keys(payables).length) {
    tableBody.innerHTML = `<tr class="text-center"><td colspan="8">No payments data</td></tr>`
  }

  if (downloadData) {
    downloadData[type] = csvContent;
  }
  await Promise.all(promises)
}

/**
 * --------------------------------------------------
 * Update Student with id
 * --------------------------------------------------
 */

const updateStudentModal = document.getElementById('update-details-modal')
if (updateStudentModal)
updateStudentModal.addEventListener('show.bs.modal', event => {
  const params = new URLSearchParams(document.location.search);
  const id = params.get('id')
  const student = students[id]
  const joinDate = new Date(student.joinDate)
  updateStudentModal.querySelector('#studentId').value = id
  updateStudentModal.querySelector('#joinMonth').value = joinDate.getMonth()
  updateStudentModal.querySelector('#joinYear').value = joinDate.getFullYear()
  updateStudentModal.querySelector('#studentName').value = student.studentName
  updateStudentModal.querySelector('#studentEmail').value = student?.studentEmail || ''
  updateStudentModal.querySelector('#universityStudentId').value = student.universityStudentId
})

async function updateStudent() {
  try {
    processingMessage()
    const params = new URLSearchParams(document.location.search);
    const id = params.get('id')
    
    const basicInfoData = Object.fromEntries(new FormData(updateStudentForm));
  
    const studentId = updateStudentForm.querySelector('#studentId').value
    const { joinMonth, joinYear, universityStudentId, studentName, studentEmail } = basicInfoData
    const date = new Date(joinYear, joinMonth, 2)
    const joinDate = `${date.toISOString().slice(0,10)}`
  
    // Validation
    if (id != studentId) failMessage("Can't update student LSQ Id")
    if (!studentId || !studentName || !studentEmail || !joinMonth || !joinYear || !universityStudentId) 
      { failMessage("Please provide all data"); return }
  
    const newStudent = { studentId, joinDate, universityStudentId, studentName, studentEmail }
    updateData(`students/${studentId}`, newStudent)
      .then((result) => {
        if (result) {
          successMessage("Student added successfully!")
            .then(() => location.reload())
        }
        else {
          failMessage("Failed to update student")
        }
      })
  }
  catch(error) {
    console.log(error)
    failMessage("Error adding student");
  }
}
window.updateStudent = updateStudent

/**
 * --------------------------------------------------
 * Delete Student
 * --------------------------------------------------
 */

function deleteStudent(id) {
  if (confirm(`Confirm delete student with id: ${id}`))
  deleteData(`students/${id}`)
    .then((result) => {
      if (result) {
        successMessage("Agent deleted successfully!")
        .then(() => location.reload())
      } else {
        failMessage("Failed deleting student");
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error deleting student");
    });
}

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async () => {
  processingMessage()
  const pageName = window.location.pathname.split('/').pop().split(".html")[0];
  await fetchData()
  switch (pageName) {
    case "students": {
      listAllStudents();
      break;
    }
    case "student_details": {
      const params = new URLSearchParams(document.location.search);
      const id = params.get('id')
      if (!id) location.href = "students.html"
      readStudentDetails(id)
      readPaymentDetails(id)
      break;
    }
  }
}
const updateBtn = document.getElementById("updateBtn")
if (updateBtn) updateBtn.onclick = updateStudent

/**
 * --------------------------------------------------
 * Update Payment Details
 * --------------------------------------------------
 */

const editDetailsModel = document.getElementById('edit-details')
editDetailsModel.addEventListener('show.bs.modal', event => {
  const button = event.relatedTarget
  const row = button.closest('tr')
  const CommissionType = button.closest('table').id

  const pay_currency = editDetailsModel.querySelector('#pay_currency')
  pay_currency.innerHTML = currency_options  

  editDetailsModel.querySelector('#payment-id').value = row.id
  editDetailsModel.querySelector('#commissionType').value = CommissionType
  editDetailsModel.querySelector('#student-name').value = row?.querySelector('.student').textContent
  editDetailsModel.querySelector('#university-name').value = row?.querySelector('.university').textContent
  editDetailsModel.querySelector('#agent-name').value = row?.querySelector('.agent').textContent
  editDetailsModel.querySelector('#stage').value = row?.querySelector('.stage').textContent
  editDetailsModel.querySelector('#duedate').value = row?.querySelector('.duedate').textContent
  editDetailsModel.querySelector('#amount').value = payments[CommissionType][row.id]?.amount || ''
  pay_currency.value = payments[CommissionType][row.id]?.currency || ''
  editDetailsModel.querySelector('#fees').value = row?.querySelector('.fees').textContent
  editDetailsModel.querySelector('#notes').value = payments[CommissionType][row.id]?.notes || ''
  editDetailsModel.querySelector('#status').value = row?.querySelector('.status').textContent.trim()
})

async function updateDetails() {
  try {
    const formProps = new FormData(updatePaymentDetailsForm);
    const formData = Object.fromEntries(formProps);
    const CommissionType = formData['commissionType']
    const id = formData['payment-id']
    const dueDate = formData['dueDate']
    const amount = formData['amount']
    const notes = formData['notes']
    const currency = formData['currency']    
  
    if (!id || !dueDate || !amount || !currency) { 
      failMessage("Failed to update payment details"); 
      return 
    }
    if (updateData(`${CommissionType}/${id}`, {dueDate, amount, notes, currency})) {
      successMessage("Payment details updated!").then(() => location.reload())
    } else {
      failMessage("Payment update failed.")
    }
  } catch (e) {
    failMessage("Failed to update payment details")
  }
}
window.updateDetails = updateDetails

/**
 * --------------------------------------------------
 * Update Status
 * --------------------------------------------------
 */

const morePaymentsSelect = document.getElementById("morePayments")
morePaymentsSelect.addEventListener("change", () => {
  if (morePaymentsSelect.value == "1") {
    nextPaymentDetails.classList.remove("d-none")
  } else {
    nextPaymentDetails.classList.add("d-none")
  }
})

const updateStatusModal = document.getElementById("update-status")
updateStatusModal.querySelector('#status').addEventListener('change', e => {
  if (e.target.value == 'pending') {
    morePaymentsSelect.value = 0; morePaymentsSelect.disabled = true
    nextPaymentDetails.classList.add("d-none")
  } else {
    morePaymentsSelect.value = 0; morePaymentsSelect.disabled = false
    nextPaymentDetails.classList.add("d-none")
  }
})
updateStatusModal.addEventListener('show.bs.modal', event => {
  const button = event.relatedTarget
  const row = button.closest('tr')
  const CommissionType = button.closest('table').id

  updateStatusForm.reset();
  nextPaymentDetails.classList.add("d-none")
  updateStatusModal.querySelector('#payment-id').value = row.id
  updateStatusModal.querySelector('#commissionType').value = CommissionType
  updateStatusModal.querySelector('#notes').value = payments[CommissionType][row.id]?.notes || ''
  updateStatusModal.querySelector('#status').value = payments[CommissionType][row.id].status
  
  const stageSelector = updateStatusModal.querySelector('#stage')
  updatestudyStageList(row.id, CommissionType, stageSelector)

  if (updateStatusModal.querySelector('#status').value == 'pending') {
    morePaymentsSelect.value = 0; morePaymentsSelect.disabled = true
  } else {
    let isMorePayment = 0
    try {
      isMorePayment = parseInt(payments[CommissionType][row.id].morePayments)
    } catch { isMorePayment = 0 }
    if (isMorePayment) {
      morePaymentsSelect.value = 1; morePaymentsSelect.disabled = true
    } else { 
      morePaymentsSelect.value = 0; morePaymentsSelect.disabled = false 
    }
  }

})

async function updateStatus() {
  try {
    const formProps = new FormData(updateStatusForm);
    const formData = Object.fromEntries(formProps);
    const CommissionType = formData['commissionType']
    const id = formData['payment-id']
    const status = formData['status']
    const notes = formData['notes']
    const stage = formData['stage']
    const fees = formData['fees']
    const feesCurrency = formData['feesCurrency']
    const dueDate = formData['dueDate']
    const amount = formData['amount']
    const newStatus = formData['newStatus']
    const currency = formData['currency']

    if (!id || !status) {
      failMessage("Please provide all inputs")
      return
    }

    let morePayments = ''
    if (formData['morePayments']) {
      morePayments = parseInt(formData['morePayments'])
    }

    if (morePayments && (!stage || !fees || !feesCurrency || !dueDate || !amount || !newStatus)) {
      failMessage("Please provide all inputs")
      return
    }

    let res = 0
    if (morePayments) {
      writeDataWithNewId(`${CommissionType}`, {
        ...payments[CommissionType][id],
        stage, fees, feesCurrency, dueDate, amount, status: newStatus, currency, notes: ''
      })
      res = updateData(`${CommissionType}/${id}`, {status, notes, morePayments})
    } else if (morePayments == 0) {
      res = updateData(`${CommissionType}/${id}`, {status, notes, morePayments})
    } else {
      res = updateData(`${CommissionType}/${id}`, {status, notes})
    }
    
    if (res) {
      successMessage('Payment status updated!').then(() => location.reload())
    } else { throw "Not saved" }
  } catch (e) {
    failMessage('Failed to update payment status')
    console.error(e)
  }
} 
window.updateStatus = updateStatus

function updatestudyStageList(paymentId, CommissionType, stageSelector) {
  stageSelector.innerHTML = '<option value="">Select stage</option>'
  const uid = payments[CommissionType][paymentId].university
  const studentId = payments[CommissionType][paymentId].student
  const pid = students[studentId].program_type

  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return
  availablestudyStages = pType.studyStages

  const stageIds = pType.studyStages.map(pst => pst.stage)
  stageIds.forEach(stageId => {
    let stage = studyStages[stageId]
    if (stage) {
      let option = document.createElement("option");
      option.value = stageId;
      option.textContent = stage.name;
      stageSelector.appendChild(option);
    }
  });
}

computeCommission.addEventListener("click", (event) => {
  const button = event.target
  console.log("Clicked", button)
  const form = button.closest('form')
  const CommissionType= form.querySelector('#commissionType').value
  const selectedStage= form.querySelector('#stage').value
  console.log(selectedStage)
  const stageConfig = availablestudyStages.find(s => s.stage == selectedStage)
  const commissions = stageConfig?.commissions
  console.log(stageConfig)
  if (!commissions) return

  const isReceivable = CommissionType == 'receivable' ? 1 : 0

  let amountInput = form.querySelector('#amount')
  let dueDateInput = form.querySelector('#dueDate')
  let currencyInput = form.querySelector('#currency')
  let feesCurrencyInput = form.querySelector('#fees_currency')
  const fees = form.querySelector('#fees').value
  if (!fees) return

  let dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[isReceivable].installmentDays || 0));

  dueDateInput.value = `${dueDate.toISOString().slice(0,10)}`
  switch (commissions[isReceivable].type) {
    case 'fixed': {
      amountInput.value = commissions[isReceivable].value
      currencyInput.value = commissions[isReceivable].currency
      break;
    }
    case 'percentage': {
      amountInput.value = parseInt(fees * (commissions[isReceivable].value/100))
      currencyInput.value = feesCurrencyInput.value
      break;
    }
    case 'na': {
      failMessage("Commission for this stage is NA. Please select No further payments.")
    }
  }
})

async function deleteTransaction(id, type) {
  if (confirm("Confirm delete transaction?")) {      
    try {
      if (await deleteData(`${type}/${id}`)) {
        successMessage('Commission deleted successfully!').then(() => location.reload())
      } else { throw "Not deleted" }
    } catch (e) {
      failMessage('Failed to delete commission')
      console.error(e)
    }
  }
}
window.deleteTransaction = deleteTransaction
