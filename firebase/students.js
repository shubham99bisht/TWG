import { readData, deleteData, fetchPaymentDetails, updateData } from "./helpers.js";

// Global Variables
let programs = {}, students = {}, universities = {}, agents = {}, currency = {}, paymentStages = {}

async function fetchData() {
  programs = await readData("program_types")
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  currency = await readData("currency_types")
  paymentStages = await readData("payment_stages")
}

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
            <td class="id align-middle white-space-nowrap py-2">{}</td>
            <td class="name align-middle white-space-nowrap py-2">
              <h5 class="mb-0 fs--1"><a href="student_details.html?id={}">{}</a></h5>
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
                          <a class="dropdown-item text-warning" href="add_student.html?id={}">Edit Student</a>
                        </div>
                    </div>
                </div>
            </td>
        </tr>`

      Object.keys(students).forEach(id => {
        try {
          const s = students[id]
          const u = universities[s.university].name
          const p = programs[s.program_type].name
          let source = s.source
          if (source == 'Agent') {
            source += '<br>' + s.agent
          }
          
          const row = schema.format(id, id, s.studentName, s.universityStudentId, u, p, source, id, id)
          if (tableBody) tableBody.innerHTML += row
        } catch {}
      });

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
  const payableBody = document.getElementById("table-payable-body");
  const receivableBody = document.getElementById("table-receivable-body");
  await updatePayables(payableBody, data["Payable"])
  if (!isAgent) {
    await updatePayables(receivableBody, data["Receivable"])
  }
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
    try {
      const p = payables[id]
      const AgentName = agents && agents[p.agent]?.name || ''
      const StudentName = students[p.student].studentName
      const UniversityName = universities[p?.university].name
  
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
        amount = `${p.amount} ${currency[p.currency].name}`
      } else if (p.amount) {
        amount = `${p.amount}%`
      }
  
      const row = schema.format(p.student, StudentName, p.university, UniversityName,
          p.agent, AgentName, stage.name, `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, status)
        if (tableBody) tableBody.innerHTML += row
    } catch (e) {
      console.log(e)
    }
  });

  if (!Object.keys(payables).length) {
    tableBody.innerHTML = `<tr class="text-center"><td colspan="8">No payments data</td></tr>`
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
  updateStudentModal.querySelector('#universityStudentId').value = student.universityStudentId
})

async function updateStudent() {
  try {
    processingMessage()
    const params = new URLSearchParams(document.location.search);
    const id = params.get('id')
    
    const basicInfoData = Object.fromEntries(new FormData(updateStudentForm));
  
    const studentId = updateStudentForm.querySelector('#studentId').value
    const { joinMonth, joinYear, universityStudentId, studentName } = basicInfoData
    const date = new Date(joinYear, joinMonth, 2)
    const joinDate = `${date.toISOString().slice(0,10)}`
  
    // Validation
    if (id != studentId) failMessage("Can't update student LSQ Id")
    if (!studentId || !studentName || !joinMonth || !joinYear || !universityStudentId) 
      { failMessage("Please provide all data"); return }
  
    const newStudent = { studentId, joinDate, universityStudentId, studentName }
    updateData(`students/${studentId}`, newStudent)
      .then((result) => {
        if (result) {
          successMessage("Student added successfully!")
            .then(() => location.reload())
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
