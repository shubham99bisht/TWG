import { readData, deleteData, fetchPaymentDetails, getDates, getRemainingCredits, readDateFilters, updateData, writeDataWithNewId } from "./helpers.js";

// Global Variables
let students = {}, universities = {}, agents = {}, programs = {}, payments = {}, studyStages = {}, modules = {}
let availablestudyStages = {}, currency = {}
let currency_options = ''

const currencyInput = document.getElementById("currency")
const feesCurrencyInput = document.getElementById("fees_currency")
const programSelect = document.getElementById("program_type")

let totalModulesCount = 0, modulesCount = 0;

async function fetchData() {
  programs = await readData("program_types")
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  currency = await readData("currency_types")
  studyStages = await readData("study_stages")
  currency && Object.keys(currency).forEach(key => {
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

function listAllStudents(startDate, endDate) {
  let status = [];
  for(let i = 0; i < enrollmentStatusDropdown.options.length; i++) {
    const value = enrollmentStatusDropdown.options[i]?.value;
    status.push(value)
  }

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
            <td class="joinDate align-middle py-2">{}</td>
            <td class="enrollmentStatus align-middle py-2">{}</td>
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
          if (source == 'Agent') { source += '<br>' + s.agent }

          // Read Commencing date from first Study Plan
          let date = new Date(s?.studyPlan?.[0]?.startDate)
          let joinDate = '-'
          if (date != 'Invalid Date') {
            joinDate = `${date.toISOString().slice(0, 10)}` 
          }

          // Run Filters
          if (status && status.length && !status.includes(s.enrollmentStatus)) return
          if (startDate != 'Invalid Date' && endDate != 'Invalid Date') {
            if (date < startDate || date > endDate) return
          }

          const row_id = `LSQ: ${id}<br>Univ: ${s.universityStudentId}`
          const row = schema.format(id, row_id, s.studentName, s?.studentEmail || '-', u, p, source, joinDate, s?.enrollmentStatus || '', id, id)
          if (tableBody) tableBody.innerHTML += row

          csvContent += csvRow.format(s.studentName, s?.studentEmail || '-', u, p, source, joinDate, s?.enrollmentStatus || '')
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

      // Read Commencing date from first Study Plan
      let date = new Date(result?.studyPlan?.[0]?.startDate)
      console.log(date)
      let joinDate = '-'
      if (date != 'Invalid Date') {
        joinDate = `${date.toISOString().slice(0, 10)}` 
      }

      modulesCount = 0;
      totalModulesCount = Number(result?.totalModules);
      const universityName = await readData(`universities/${result?.university}/name`)
      const programName = await readData(`program_types/${result?.program_type}/name`)
      modules = await readData(`program_types/${result?.program_type}`);

      document.getElementById("name").innerHTML = result?.studentName || '-'

      // Basic Info
      document.getElementById("student_id").innerHTML = id
      document.getElementById("university_id").innerHTML = result.universityStudentId
      document.getElementById("join_date").innerHTML = joinDate || '-'
      document.getElementById("enrollment_status").innerHTML = result?.enrollmentStatus || '-'
      document.getElementById("student_email").innerHTML = result?.studentEmail || '-'
      document.getElementById("student_phone").innerHTML = result?.studentPhone || '-'
      document.getElementById("student_address").innerHTML = result?.studentAddress || '-'
      document.getElementById("student_city_state").innerHTML = `${result?.studentCity || ''}, ${result?.studentState || ''}`
      
      // Enrollment Info
      document.getElementById("university").innerHTML = universityName || ''
      document.getElementById("program_type").innerHTML = programName || ''
      document.getElementById("source").innerHTML = result?.source
      document.getElementById("agent").innerHTML = result?.agent ? `${agents?.[result?.agent]?.name || ''} [${result?.agent}]` : '-'
      document.getElementById('degree').innerHTML = result?.universityDegree || '-'

      // GDrive Links
      document.getElementById("twgOfferLink").value = result?.twgOfferLink || ''
      document.getElementById("universityOfferLink").value = result?.universityOfferLink || ''
      document.getElementById("gDriveLink").value = result?.gDriveLink || ''
      document.getElementById("twgModalLink").value = result?.twgOfferLink || ''
      document.getElementById("universityModalLink").value = result?.universityOfferLink || ''
      document.getElementById("gDriveModalLink").value = result?.gDriveLink || ''

      loadStudyPlan(result?.studyPlan)
      loadLearningPlan(result?.learningPlan)
      loadFeePayable(result?.learningPlan || {}, result?.feePayable || {}, result?.totalFeePayable || 0, result?.totalModules || 0)

      document.getElementById('overallGradeTWG').value = result?.overallGradeTWG || '';
      document.getElementById('studentUniversityId').value = result?.university;
      document.getElementById('studentProgramId').value = result?.program_type;
      document.getElementById('agentId').value = result?.agent || '';
      document.getElementById('universityId').value = result?.university || '';
      document.getElementById('flagPageLink').setAttribute('href', `flagged_students.html?stdId=${id}`)

      closeSwal()
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error fetching student data");
    });
}
window.readStudentDetails = readStudentDetails

function loadStudyPlan(studyPlan) {
  if (!studyPlan) return
  const table = document.getElementById('studyPlan')
  const keys = Object.keys(studyPlan);
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i];
    const data = studyPlan[id]
    const studyStage = studyStages?.[data.studyStage]
    const row = `<tr id="${id}">
      <td class="align-middle name">${studyStage?.name || ''}</td>
      <td class="text-center align-middle date">${data.startDate}</td>
      <td class="text-center align-middle status">${data.status}</td>
      <td class="text-center align-middle notes">${data.notes}</td>
      <td class="text-center align-middle">
        <button class="btn btn-link btn-sm" type="button" onclick="removeStudyPlan('${id}')">
          <span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span>
        </button>
        <button class="btn btn-link btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#studyPlanModal">
          <span class="fas fa-pencil-alt text-primary" data-fa-transform="shrink-2"></span>
        </button>
      </td>
    </tr>`
    table.innerHTML += row
  }
}

function loadLearningPlan(learningPlan) {
  if (!learningPlan) return
  const table = document.getElementById('learningPlan');
  const keys = Object.keys(learningPlan);
  for (let i = 0; i < keys.length; i++) {
    const termId = keys[i];
    const data = learningPlan[termId];

    let tableBody = ''
    const moduleKeys = data.modules ? Object.keys(data?.modules) : [];
    for (let j = 0; j < moduleKeys.length; j++) {

      const moduleId = moduleKeys[j];
      const moduleData = data.modules[moduleId];
      const row = `<tr id="${moduleId}">
        <td class="align-middle name">${moduleData.name}</td>
        <td class="text-center align-middle result">${moduleData.result}</td>
        <td class="text-center align-middle grade">${moduleData.grade}</td>
        <td class="text-center align-middle notes">${moduleData.notes}</td>
        <td class="text-center align-middle">
          <button class="btn btn-link btn-sm" type="button" onclick="removeModule('${termId}','${moduleId}')">
            <span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span>
          </button>
          <button class="btn btn-link btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#twgTermModuleModal">
            <span class="fas fa-pencil-alt text-primary" data-fa-transform="shrink-2"></span>
          </button>
        </td>
      </tr>`
      tableBody += row
    }

    modulesCount += Number(data?.count);

    const Term = `
    <div class="border rounded-1 mt-3 position-relative bg-white dark__bg-1100 p-3 mb-3 Term">
      <div class="row form-group">
        <div class="col-lg-4 col-12 mb-3">
          <label class="form-label" for="termName">Term Number<span class="text-danger">*</span></label>
          <input class="form-control termName" name="termName" type="text" value="${data.name}" disabled />
        </div>
        <div class="col-lg-4 col-12 mb-3">
          <label class="form-label" for="startDate">Start Date<span class="text-danger">*</span></label>
          <input class="form-control startDate" name="startDate" type="text" value="${data.startDate}" disabled />
        </div>
        <div class="col-lg-4 col-12 mb-3">
          <label class="form-label" for="numberOfModules">Module Count<span class="text-danger">*</span></label>
          <input class="form-control numberOfModules" name="numberOfModules" type="number" value="${data.count}" disabled />
        </div>
      </div>

      <div class="table-responsive">
      <input type="hidden" value="${termId}" name="termId" id="termId"/>
        <table class="table table-sm table-bordered mt-3 bg-white dark__bg-1100">
          <thead>
            <tr class="fs--1">
              <th>Module Name</th>
              <th class="text-center">Result</th>
              <th class="text-center">Grade</th>
              <th class="text-center">Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${tableBody}
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-between">
        <div>
          <button class="btn btn-falcon-danger btn-sm mt-2" type="button" onclick="removeTerm('${termId}')">Delete</button>
          <button class="btn btn-falcon-default align-self-start btn-sm mt-2" type="button" data-bs-toggle="modal" data-bs-target="#twgTermEditModal">Edit</button>
        </div>
        <input type="hidden" value="${termId}" name="termId" id="termId"/>
        <button id="addModule" class="btn btn-falcon-default btn-sm mt-2" type="button"  data-bs-toggle="modal" data-bs-target="#twgTermModuleModal"><span class="fas fa-plus fs--2 me-1" data-fa-transform="up-1"></span>Add Module</button>
        </div>
    </div>`
    table.innerHTML += Term
  }

  if (modulesCount == totalModulesCount) {
    document.getElementById('modulesCheckSuccessBadge').classList.remove("d-none");
    document.getElementById('modulesCheckDangerBadge').classList.add("d-none");
  } else {
    document.getElementById('modulesCheckSuccessBadge').classList.add("d-none");
    document.getElementById('modulesCheckDangerBadge').classList.remove("d-none");
  }
}

function loadFeePayable(learningPlan, feePayable, totalFeePayable=0, totalModules=0) {
  // if (!feePayable) return
  const table = document.getElementById('feePayableTable')

  let totalPaid = 0
  totalFeePayable = Number(totalFeePayable)
  totalModules = Number(totalModules)

  const keys = Object.keys(feePayable)
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i]
    const data = feePayable[id]
    totalPaid += parseFloat(data['amount']) || 0
    const row = `<tr id="${id}">
      <td class="align-middle amount">${data.amount || ''}</td>
      <td class="text-center align-middle date">${data.date}</td>
      <td class="text-center align-middle notes">${data.notes}</td>
      <td class="text-center align-middle">
        <button class="btn btn-link btn-sm" type="button" onclick="removeFeePayable('${id}')">
          <span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span>
        </button>
        <button class="btn btn-link btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#feepayable">
          <span class="fas fa-pencil-alt text-primary" data-fa-transform="shrink-2"></span>
        </button>
      </td>
    </tr>`
    table.innerHTML += row
  }

  // [Total fee paid] - [(Total Fee Payable for hybrid) / (Total Modules enrolled for in Hybrid Component) * (# of modules where “name of module” is defined)]
 const studyCredits = getRemainingCredits(feePayable, learningPlan, totalFeePayable, totalModules);

  document.getElementById('totalFeePayable').value = totalFeePayable
  document.getElementById('totalFeePaid').value = totalPaid
  document.getElementById('totalModules').value = totalModules
  document.getElementById('creditsRemaining').value = studyCredits
  document.getElementById('topTotalFeePayable').value = totalFeePayable
  document.getElementById('topTotalFeePaid').value = totalPaid
  document.getElementById('topTotalModules').value = totalModules
  document.getElementById('topCreditsRemaining').value = studyCredits;
}

async function readPaymentDetails(id) {
  const userRole = localStorage.getItem("userRole")
  const isAgent = userRole == 'Agent' ? true : false

  const data = await fetchPaymentDetails('student', id)
  payments = data
  const payableBody = document.getElementById("table-payable-body");
  const receivableBody = document.getElementById("table-receivable-body");
  data["payable"] && Object.keys(data["payable"]).length && document.getElementById('payableNewPayment').classList.add('d-none');
  data["receivable"] && Object.keys(data["receivable"]).length && document.getElementById('receivableNewPayment').classList.add('d-none');
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
    updateStudentModal.querySelector('#studentId').value = id
    
    updateStudentModal.querySelector('#studentName').value = student.studentName
    updateStudentModal.querySelector('#universityStudentId').value = student.universityStudentId
    updateStudentModal.querySelector('#enrollmentStatus').value = student?.enrollmentStatus
    updateStudentModal.querySelector('#studentEmail').value = student?.studentEmail || ''
    updateStudentModal.querySelector('#studentPhone').value = student?.studentPhone || ''
    updateStudentModal.querySelector('#studentAddress').value = student?.studentAddress || ''
    updateStudentModal.querySelector('#studentCity').value = student?.studentCity || ''
    updateStudentModal.querySelector('#studentState').value = student?.studentState || ''
  })

async function updateStudent() {
  try {
    processingMessage()
    const params = new URLSearchParams(document.location.search);
    const id = params.get('id')

    const basicInfoData = Object.fromEntries(new FormData(updateStudentForm));

    const studentId = updateStudentForm.querySelector('#studentId').value
    const { 
      studentName, universityStudentId,
      studentEmail, studentPhone, studentAddress, studentCity, studentState 
    } = basicInfoData

    const enrollmentStatus = updateStudentForm.querySelector('#enrollmentStatus').value;
    // Validation
    if (id != studentId) failMessage("Can't update Student Id")
    if (!studentId || !studentName || !studentEmail || !universityStudentId) { failMessage("Please provide all data"); return }

    const newStudent = { 
      studentId, studentName, universityStudentId,
      studentEmail, studentPhone, studentAddress, studentCity, studentState 
    }
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
  catch (error) {
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

async function deleteStudent() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get('id')
  if (confirm(`Confirm delete student with id: ${id}`))
  try {
    await deleteFilteredCommissions(id)
    const result = await deleteData(`students/${id}`)
    if (result) {
      successMessage("Student deleted successfully!")
        .then(() => window.location = 'students.html')
    } else {
      failMessage("Failed deleting student");
    }
  } catch  (error) {
    console.log(error)
    failMessage("Error deleting student");
  }
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
      // Initialize Datepicker
      const [startOfYear, currentDate] = getDates();
      const datepickerInstance = flatpickr("#datepicker", {
        mode: 'range', dateFormat: 'M d Y', 'disableMobile':true,
        'defaultDate': [startOfYear, currentDate] 
      });

      // Initialise Search button
      const searchStudents = document.getElementById('searchButton')
      searchStudents.addEventListener('click', () => {
        const dateRange = readDateFilters(datepickerInstance);
        const startDate = new Date(dateRange[0]); const endDate = new Date(dateRange[1]);
        listAllStudents(startDate, endDate)
      })

      listAllStudents(startOfYear, currentDate);
      break;
    }
    case "student_details": {
      const params = new URLSearchParams(document.location.search);
      const id = params.get('id')
      if (!id) location.href = "students.html"

      const deleteStudentBtn = document.getElementById("deleteStudent")
      const userRole = localStorage.getItem("userRole")
      if (userRole != 'Admin') { deleteStudentBtn.classList.add("d-none") }
      else { deleteStudentBtn.onclick = deleteStudent }

      readStudentDetails(id)
      readPaymentDetails(id)
      await fetchStudentDetailsData()
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
    if (updateData(`${CommissionType}/${id}`, { dueDate, amount, notes, currency })) {
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
      res = updateData(`${CommissionType}/${id}`, { status, notes, morePayments })
    } else if (morePayments == 0) {
      res = updateData(`${CommissionType}/${id}`, { status, notes, morePayments })
    } else {
      res = updateData(`${CommissionType}/${id}`, { status, notes })
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
  const form = button.closest('form')
  const CommissionType = form.querySelector('#commissionType').value
  const selectedStage = form.querySelector('#stage').value
  const stageConfig = availablestudyStages.find(s => s.stage == selectedStage)
  const commissions = stageConfig?.commissions
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

  dueDateInput.value = `${dueDate.toISOString().slice(0, 10)}`
  switch (commissions[isReceivable].type) {
    case 'fixed': {
      amountInput.value = commissions[isReceivable].value
      currencyInput.value = commissions[isReceivable].currency
      break;
    }
    case 'percentage': {
      amountInput.value = parseInt(fees * (commissions[isReceivable].value / 100))
      currencyInput.value = feesCurrencyInput.value
      break;
    }
    case 'na': {
      failMessage("Commission for this stage is NA. Please select No further payments.")
    }
  }
})

computePayabaleCommission.addEventListener("click", (event) => {
  const button = event.target
  const form = button.closest('form')
  const CommissionType = form.querySelector('#newPayableCommisionType').value
  const selectedStage = form.querySelector('#newPaymentstage').value

  const uid = document.getElementById("studentUniversityId").value;
  const pid = document.getElementById("studentProgramId").value;
  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return
  availablestudyStages = pType.studyStages

  const stageConfig = availablestudyStages.find(s => s.stage == selectedStage)
  const commissions = stageConfig?.commissions
  if (!commissions) return

  const isReceivable = CommissionType == 'receivable' ? 1 : 0

  let amountInput = form.querySelector('#amount')
  let dueDateInput = form.querySelector('#dueDate')
  let currencyInput = form.querySelector('#newPaymentcurrency')
  let feesCurrencyInput = form.querySelector('#newPayment_fees_currency')
  const fees = form.querySelector('#fees').value
  if (!fees) return

  let dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[isReceivable].installmentDays || 0));

  dueDateInput.value = `${dueDate.toISOString().slice(0, 10)}`
  switch (commissions[isReceivable].type) {
    case 'fixed': {
      amountInput.value = commissions[isReceivable].value
      currencyInput.value = commissions[isReceivable].currency
      break;
    }
    case 'percentage': {
      amountInput.value = parseInt(fees * (commissions[isReceivable].value / 100))
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


function updateStudyPlanStageList(studentId) {
  const stageSelector = document.getElementById('studyPlanStage')
  stageSelector.innerHTML = '<option value="">Select stage</option>'

  const pid = students[studentId].program_type
  const uid = students[studentId].university
  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return

  const stageIds = pType.studyStages.map(pst => pst.stage)
  stageIds.forEach(stageId => {
    let stage = studyStages[stageId]
    if (stage) {
      let option = document.createElement("option");
      option.value = stageId;
      option.name = stageId;
      option.textContent = stage.name;
      stageSelector.appendChild(option);
    }
  });

}
window.updateStudyPlanStageList = updateStudyPlanStageList

function updateStudyPlanStageListById(studentId,selectorId) {
  const stageSelector = document.getElementById(selectorId)
  stageSelector.innerHTML = '<option value="">Select stage</option>'

  const pid = students[studentId].program_type
  const uid = students[studentId].university
  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return

  const stageIds = pType.studyStages.map(pst => pst.stage)
  stageIds.forEach(stageId => {
    let stage = studyStages[stageId]
    if (stage) {
      let option = document.createElement("option");
      option.value = stageId;
      option.name = stageId;
      option.textContent = stage.name;
      stageSelector.appendChild(option);
    }
  });

}
window.updateStudyPlanStageListById = updateStudyPlanStageListById


/**
 * --------------------------------------------------
 * Update TWG Learning Plan term
 * --------------------------------------------------
 */

function addModule(event) {
  const module = `
    <td>
      <select class="form-select form-select-sm module mb-1" required="required">
        <option hidden disabled selected value="">Select Module</option>
      </select>
    </td>
    <td>
      <select class="form-select form-select-sm result mb-1" required="required">
        <option selected disabled class="d-none"></option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
        <option value="withdrawn">Withdrawn</option>
      </select>
    </td>
    <td><input class="form-control form-control-sm grade" type="text" required="required"/></td>
    <td><input class="form-control form-control-sm notes" type="text" required="required"/></td>
    <td class="text-center align-middle"><button class="btn btn-link btn-sm" type="button" onclick="removeModuleTemp(event)"><span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span></button></td>`

  const button = event.target;
  const tablePair = button.closest('.Term');
  if (tablePair) {
    const table = tablePair.querySelector('table tbody');
    if (table) {
      const newRow = table.insertRow();
      newRow.classList.add('align-middle')
      newRow.innerHTML += module

      const newSelect = newRow.querySelector(".module")

      modules.modules.forEach(m => {
        let option = document.createElement("option");
        option.value = m;
        option.textContent = m;
        newSelect.appendChild(option);
      });
    }
  }
}
window.addModule = addModule;

function removeModuleTemp(event) {
  const button = event.target;
  const row = button.closest('tr');
  row.remove();
}
window.removeModuleTemp = removeModuleTemp;

function readLearningPlan() {
  const termsContainer = document.getElementById('updateTwgTermForm');
  const terms = termsContainer.querySelectorAll('.Term');

  const term = terms[0]
  const termData = {
    name: term.querySelector('select#termName').value,
    startDate: term.querySelector('.startDate').value,
    count: term.querySelector('.numberOfModules').value,
    modules: []
  }

  if (!termData.name || !termData.startDate || !termData.count) { failMessage("Please complete Term information."); return false}

  const rows = term.querySelectorAll('tbody tr');
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]
    const name = row.querySelector('.module').value;
    const result = row.querySelector('.result').value;
    const grade = row.querySelector('.grade').value;
    const notes = row.querySelector('.notes').value;
    termData.modules.push({ name, result, grade, notes });
  }
  return termData
}
window.readLearningPlan = readLearningPlan

function updateModuleList() {
  const stageSelector = document.getElementById('twgModuleName')
  stageSelector.innerHTML = '<option value="">Select Module</option>'


  modules.modules.forEach(stageId => {
    if (stageId) {
      let option = document.createElement("option");
      option.value = stageId;
      option.name = stageId;
      option.textContent = stageId;
      stageSelector.appendChild(option);
    }
  });

}
window.updateModuleList = updateModuleList

/**
 * --------------------------------------------------
 * Update Link Form
 * --------------------------------------------------
 */
const updateLinkForm = document.getElementById('studentsLinkForm');
if (updateLinkForm) {
  updateLinkForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    processingMessage('Updating links...');
    const twgOfferLink = document.getElementById('twgModalLink').value;
    const universityOfferLink = document.getElementById(
      'universityModalLink'
    ).value;
    const gDriveLink = document.getElementById('gDriveModalLink').value;

    if (
      !twgOfferLink?.trim() ||
      !universityOfferLink?.trim() ||
      !gDriveLink?.trim()
    ) {
      failMessage('Please provide all links');
      return;
    }

    try {
      const params = new URLSearchParams(document.location.search);
      const id = params.get('id');

      await updateData(`students/${id}/`, {
        twgOfferLink,
        universityOfferLink,
        gDriveLink,
      });

      document.getElementById('twgOfferLink').value = twgOfferLink;
      document.getElementById('universityOfferLink').value =
        universityOfferLink;
      document.getElementById('gDriveLink').value = gDriveLink;
      document.getElementById('twgModalLink').value = twgOfferLink;
      document.getElementById('universityModalLink').value =
        universityOfferLink;
      document.getElementById('gDriveModalLink').value = gDriveLink;
      document.getElementById('linksModalCloseBtn').click();
      successMessage('Links updated successfully!');
    } catch (error) {
      console.log(error);
      failMessage('Failed to links!');
      return;
    }
  });
}
