import { readData, updateData, writeDataWithNewId } from "./helpers.js";

let students = {}, universities = {}, agents = {}, payments = {}
let availablePaymentStages = {}

const CommissionType = 'payable'
const isReceivable = CommissionType == 'receivable' ? 1 : 0

/**
 * --------------------------------------------------
 * Update Payment Details
 * --------------------------------------------------
 */

const editDetailsModel = document.getElementById('edit-details')
editDetailsModel.addEventListener('show.bs.modal', event => {
  const button = event.relatedTarget
  const row = button.closest('tr')

  editDetailsModel.querySelector('#payment-id').value = row.id
  editDetailsModel.querySelector('#student-name').value = row?.querySelector('.student').textContent
  editDetailsModel.querySelector('#university-name').value = row?.querySelector('.university').textContent
  editDetailsModel.querySelector('#agent-name').value = row?.querySelector('.agent').textContent
  editDetailsModel.querySelector('#stage').value = row?.querySelector('.stage').textContent
  editDetailsModel.querySelector('#duedate').value = row?.querySelector('.duedate').textContent
  editDetailsModel.querySelector('#amount').value = row?.querySelector('.amount').textContent
  editDetailsModel.querySelector('#fees').value = row?.querySelector('.fees').textContent
  editDetailsModel.querySelector('#notes').value = payments[row.id]?.notes || ''
  editDetailsModel.querySelector('#status').value = row?.querySelector('.status').textContent.trim()
})

async function updateDetails() {
  try {
    const formProps = new FormData(updatePaymentDetailsForm);
    const formData = Object.fromEntries(formProps);
    const id = formData['payment-id']
    const dueDate = formData['dueDate']
    const amount = formData['amount']
    const notes = formData['notes']
  
    if (!id || !dueDate || !amount) failMessage("Failed to update payment details")
    updateData(`${CommissionType}/${id}`, {dueDate, amount, notes})
    successMessage("Payment details updated!").then(() => location.reload())
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
updateStatusModal.addEventListener('show.bs.modal', event => {
  const button = event.relatedTarget
  const row = button.closest('tr')

  updateStatusForm.reset();
  updateStatusModal.querySelector('#payment-id').value = row.id
  updateStatusModal.querySelector('#notes').value = payments[row.id]?.notes || ''
  updateStatusModal.querySelector('#status').value = payments[row.id].status
  
  const stageSelector = updateStatusModal.querySelector('#stage')
  updatePaymentStageList(row.id, stageSelector)
})

async function updateStatus() {
  try {
    const formProps = new FormData(updateStatusForm);
    const formData = Object.fromEntries(formProps);
    const id = formData['payment-id']
    const status = formData['status']
    const notes = formData['notes']
    const morePayments = formData['morePayments']
    const stage = formData['stage']
    const fees = formData['fees']
    const dueDate = formData['dueDate']
    const amount = formData['amount']
    const newStatus = formData['newStatus']
  
    if (!id || !status || !notes || !stage || !fees || !dueDate || !amount || !newStatus) 
      failMessage("Failed to update")
    
    updateData(`${CommissionType}/${id}`, {status, notes, morePayments})
    writeDataWithNewId(`${CommissionType}`, {
      ...payments[id],
      stage, dueDate, amount, status: newStatus
    })
    successMessage('Payment status updated!').then(() => location.reload())
  } catch (e) {
    failMessage('Failed to update payment status')
    console.error(e)
  }
} 
window.updateStatus = updateStatus

/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllPayables() {
  const tableBody = document.getElementById("table-payable-body");
  if (!tableBody) return
  tableBody.innerHTML = ''
  readData(`${CommissionType}`)
    .then(async (payables) => {
      payments = payables
      const schema = `<tr class="btn-reveal-trigger" id="{}">
        <td class="align-middle white-space-nowrap student"><a href="student_details.html?id={}">{}</a></td>
        <td class="align-middle white-space-nowrap university"><a href="university_details.html?id={}">{}</a></td>
        <td class="align-middle white-space-nowrap agent"><a href="agent.html?id={}">{}</a></td>
        <td class="align-middle stage">{}</td>
        <td class="align-middle fees">{}</td>
        <td class="align-middle amount">{}</td>
        <td class="align-middle text-nowrap duedate">{}</td>
        <td class="align-middle fs-0 white-space-nowrap status text-center">
          {}
        </td>
        <td class="align-middle white-space-nowrap text-end">
          <div class="dropstart font-sans-serif position-static d-inline-block">
            <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal float-end" type="button" id="dropdown-recent-purchase-table-1" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false" data-bs-reference="parent"><span class="fas fa-ellipsis-h fs--1"></span></button>
            <div class="dropdown-menu dropdown-menu-end border py-2" aria-labelledby="dropdown-recent-purchase-table-1">
              <a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#edit-details" style="cursor:pointer">Edit</a>
              <a class="dropdown-item text-warning" data-bs-toggle="modal" data-bs-target="#update-status" style="cursor:pointer">Update Status</a>
            </div>
          </div>
        </td>
      </tr>`

      const promises = Object.keys(payables).map(async id => {
        const p = payables[id]
        const AgentName = agents[p.agent].name
        const StudentName = students[p.student].studentName
        const UniversityName = universities[p?.university].name

        const stage = paymentStages.find(s => s.value == p.stage)
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

        const row = schema.format(id, p.student, StudentName, p.university, UniversityName,
          p.agent, AgentName, stage.label, p.fees, p.amount, p.dueDate, status)
        if (tableBody) tableBody.innerHTML += row
      });

      await Promise.all(promises)

      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="9">No Payables found!</td></tr>`
    });
}
window.listAllPayables = listAllPayables

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */
function updatePaymentStageList(paymentId, stageSelector) {
  stageSelector.innerHTML = '<option>Select stage</option>'
  const uid = payments[paymentId].university
  const studentId = payments[paymentId].student
  const pid = students[studentId].program_type

  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return
  availablePaymentStages = pType.paymentStages

  const stageIds = pType.paymentStages.map(pst => pst.stage)
  stageIds.forEach(stageId => {
    let paymentStage = paymentStages.find(x => x.value == stageId)
    if (paymentStage) {
      let option = document.createElement("option");
      option.value = paymentStage.value;
      option.textContent = paymentStage.label;
      stageSelector.appendChild(option);
    }
  });
}

window.onload = async () => {
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  listAllPayables()
}

computeCommission.addEventListener("click", (event) => {
  const button = event.target
  const form = button.closest('form')
  const selectedStage= form.querySelector('#stage').value
  const stageConfig = availablePaymentStages.find(s => s.stage == selectedStage)
  const commissions = stageConfig?.commissions
  if (!commissions) return

  let amountInput = form.querySelector('#amount')
  let dueDateInput = form.querySelector('#dueDate')
  const fees = form.querySelector('#fees').value
  if (!fees) return
  
  let dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[isReceivable].installmentDays));

  switch (commissions[isReceivable].type) {
    case 'fixed': {
      amountInput.value = commissions[isReceivable].value
      break;
    }
    case 'percentage': {
      amountInput.value = parseInt(fees * (commissions[isReceivable].value/100))
      break;
    }
  }  
  dueDateInput.value = `${dueDate.toISOString().slice(0,10)}`
})
