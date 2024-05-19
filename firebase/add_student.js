import { readData, writeData, writeDataWithNewId } from "./helpers.js";

// Forms
const basicInfo = document.getElementById("basic-info")
const enrollmentInfo = document.getElementById("enrollment-info")
const payableForm = document.getElementById("payable")
const receivableForm = document.getElementById("receivable")

const submitBtn = document.getElementById("submitBtn")

// Select Options
const agentSelect = document.getElementById("agent")
const sourceSelect = document.getElementById("source")
const programSelect = document.getElementById("program_types")
const universitySelect = document.getElementById("university")

// Inputs

const receiveDueDateInput = document.getElementById("RdueDate")
const receiveAmountInput = document.getElementById("Ramount")

const payableDueDateInput = document.getElementById("PdueDate")
const payableAmountInput = document.getElementById("Pamount")

// Global Variables
let programs = {}, universities = {}, agents = {}, currency = {}, studyStages = {}


/**
 * --------------------------------------------------
 * Create New Student
 * --------------------------------------------------
 */

async function createStudent() {
  processingMessage()
  const basicInfoData = Object.fromEntries(new FormData(basicInfo));
  const enrollmentInfoData = Object.fromEntries(new FormData(enrollmentInfo));

  const {
    studentId, studentName, joinMonth, joinYear,
    universityStudentId, universityStudentEmail, studentPhone, studentEmail,
    studentAddress, studentCity, studentState
  } = basicInfoData
  let {
    program_type, university, source, agent,
    twgOfferLink, universityOfferLink, universityDegree,
    overseasMonth, overseasYear
  } = enrollmentInfoData

  //  Convert Dates
  let date = new Date(joinYear, joinMonth, 2)
  const joinDate = `${date.toISOString().slice(0, 10)}`
  date = new Date(overseasYear, overseasMonth, 2)
  const overseasDate = `${date.toISOString().slice(0, 10)}`

  // Validation
  if (
    !studentId || !studentName || !joinDate || !universityStudentId ||
    !universityStudentEmail || !studentPhone || !studentEmail || !studentAddress ||
    !studentCity || !studentState || !program_type || !university || !source ||
    !twgOfferLink || !universityOfferLink || !universityDegree || !overseasDate
  ) { failMessage("Please provide all data"); return }

  // Verifying old entries
  const oldStudent = await readData(`students/${studentId}`)
  if (oldStudent) {
    failMessage("Student Id already exists!")
    return
  }

  if (source == "Agent") {
    if (!agent) { failMessage("Agent Info missing!"); return }
  } else { agent = '' }

  if (source == "Agent") {
    let { stage, status, fees, amount, dueDate, notes } = Object.fromEntries(new FormData(payableForm));
    if (document.getElementById("Ptype").value != 'na' && (!stage || !status || !fees || !amount || !dueDate)) {
      failMessage("Please provide enteries for Commission Payable"); return
    }
    else {
      const res = await createPayable(studentId, university, agent, program_type)
      if (!res) {
        failMessage("Failed adding Payable"); return;
      }
    }
  }

  let { stage, status, fees, amount, dueDate, notes } = Object.fromEntries(new FormData(receivableForm));
  if (document.getElementById("Rtype").value != 'na' && (!stage || !status || !fees || !amount || !dueDate)) {
    failMessage("Please provide enteries for Commission Receivable"); return
  } else {
    const res = await createReceivable(studentId, university, agent, program_type)
    if (!res) {
      failMessage("Failed adding Receivable"); return;
    }
  }

  // Read study plan
  const studyPlan = readStudyPlan()
  if (studyPlan === undefined) return
  // Read TWG learning plan
  const learningPlan = readLearningPlan()
  if (learningPlan === undefined) return

  // Create Student
  const newStudent = {
    studentId, studentName, joinDate,
    universityStudentId, universityStudentEmail, studentPhone, studentEmail,
    studentAddress, studentCity, studentState,
    program_type, university, source,
    twgOfferLink, universityOfferLink, universityDegree, overseasDate,
    studyPlan, learningPlan
  }
  if (source == "Agent") newStudent["agent"] = agent
  console.log(newStudent)

  writeData(`students/${studentId}`, newStudent)
    .then((result) => {
      if (result) {
        successMessage("Student added successfully!")
          .then(() => location.reload())
      } else {
        failMessage("Error adding student"); return;
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error adding student");
    });
}

async function createReceivable(student, university, agent, program_type) {
  console.log("function called")
  const receivableFormData = Object.fromEntries(new FormData(receivableForm));

  console.log(receivableFormData, document.getElementById("Rtype").value)

  if (document.getElementById("Rtype").value == 'na') {
    console.log("Writting data")
    return writeDataWithNewId('receivable', {
      ...receivableFormData, amount: 0, dueDate: '', student, university, agent, program_type
    })
  }

  console.log("Not NA")

  if (!receivableFormData.amount) return
  console.log("No amount")
  return writeDataWithNewId(`receivable`, {
    ...receivableFormData, student, university, agent, program_type
  })
}

async function createPayable(student, university, agent, program_type) {
  const payableFormData = Object.fromEntries(new FormData(payableForm));

  if (document.getElementById("Ptype").value == 'na') {
    return writeDataWithNewId('payable', {
      ...payableFormData, amount: 0, dueDate: '', student, university, agent, program_type
    })
  }

  if (!payableFormData.amount) return
  return writeDataWithNewId('payable', {
    ...payableFormData, student, university, agent, program_type
  })
}

window.createStudent = createStudent
window.createReceivable = createReceivable
window.createPayable = createPayable

/**
 * --------------------------------------------------
 * Helper Functions
 * --------------------------------------------------
 */

async function fetchData() {
  programs = await readData("program_types")
  universities = await readData("universities")
  agents = await readData("agents")
  currency = await readData("currency_types")
  studyStages = await readData("study_stages")
}

function updateCurrencyList() {
  let options = ''
  for (const id in currency) {
    options += `<option id=${id} value=${id}>${currency[id].name}</option>`;
  }

  let selectors = ['RfeesCurrency', 'RCurrency', 'PfeesCurrency', 'PCurrency']
  selectors.forEach(s => {
    const sl = document.getElementById(s)
    sl.innerHTML = options
  })
}

function updateAgentList() {
  agentSelect.innerHTML = '<option selected disabled>Select an agent</option>'
  for (const id in agents) {
    const option = document.createElement("option");
    option.id = id;
    option.value = id;
    option.textContent = agents[id].name;
    agentSelect.appendChild(option);
  }
}

function updateProgramsList() {
  programSelect.innerHTML = '<option selected disabled>Select a program type</option>'
  for (const id in programs) {
    const option = document.createElement("option");
    option.id = id;
    option.value = id;
    option.textContent = programs[id].name;
    programSelect.appendChild(option);
  }
}

function updateUniversityList(pId) {
  universitySelect.innerHTML = '<option selected disabled>Select a university</option>'
  for (const id in universities) {
    const programs = universities[id].programTypes.map(p => p.type)
    if (programs.includes(pId)) {
      const option = document.createElement("option");
      option.id = id;
      option.value = id;
      option.textContent = universities[id].name;
      universitySelect.appendChild(option);
    }
  }
}

function updatestudyStageList() {
  const uid = universitySelect.value
  const pid = programSelect.value

  Pstage.innerHTML = '<option selected disabled>Select stage</option>'
  Rstage.innerHTML = '<option selected disabled>Select stage</option>'

  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return

  const stageIds = pType.studyStages.map(pst => pst.stage)
  stageIds.forEach(stageId => {
    let studyStage = studyStages[stageId]
    if (studyStage) {
      let option = document.createElement("option");
      option.value = stageId;
      option.textContent = studyStage.name;
      Pstage.appendChild(option);

      option = document.createElement("option");
      option.value = stageId;
      option.textContent = studyStage.name;
      Rstage.appendChild(option);
    }
  });
}

function updateDegreesOffered() {
  const uid = universitySelect.value
  universityDegree.innerHTML = '<option selected disabled>Select stage</option>'
  const degrees = universities[uid].degrees || []
  console.log(degrees)
  if (!degrees || !degrees.length) return

  degrees.forEach(degree => {
    let option = document.createElement("option");
    option.value = degree;
    option.textContent = degree;
    universityDegree.appendChild(option);
  });
}

function computeComissionReceivable() {
  const uid = universitySelect.value
  const pid = programSelect.value
  const sid = Rstage.value
  const fees = Rfees.value || 0
  const Rcurrency = document.getElementById('RCurrency')
  const Rnotes = document.getElementById('Rnotes')

  if (!uid || !pid || !sid || !fees) return
  const university = universities[uid]
  if (!university) return
  const programType = university.programTypes.find(p => p.type == pid)
  if (!programType) return
  const stage = programType.studyStages.find(s => s.stage == sid)
  if (!stage) return
  const commissions = stage.commissions
  if (!commissions) return

  let dueDate = new Date(joinYear.value, joinMonth.value)
  if (dueDate == 'Invalid Date') dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[1].installmentDays));

  document.getElementById("Rtype").value = commissions[1].type

  receiveDueDateInput.value = `${dueDate.toISOString().slice(0, 10)}`
  switch (commissions[1].type) {
    case 'fixed': {
      receiveAmountInput.value = commissions[1].value
      document.getElementById('RCurrency').value = commissions[1].currency
      Rnotes.disabled = false; Rnotes.value = ''
      break;
    }
    case 'percentage': {
      receiveAmountInput.value = parseInt(fees * (commissions[1].value / 100))
      document.getElementById('RCurrency').value = document.getElementById('RfeesCurrency').value
      Rnotes.disabled = false; Rnotes.value = ''
      break;
    }
    case 'na': {
      receiveAmountInput.value = '0'
      receiveAmountInput.disabled = true
      Rcurrency.disabled = true
      Rcurrency.value = ''
      receiveDueDateInput.value = ''
      receiveDueDateInput.disabled = true
      Rnotes.disabled = true
      Rnotes.value = 'N/A commission entry'

    }
  }
}

function computeComissionPayable() {
  const uid = universitySelect.value
  const pid = programSelect.value
  const sid = Pstage.value
  const fees = Pfees.value || 0

  if (!uid || !pid || !sid || !fees) return
  const university = universities[uid]
  if (!university) return
  const programType = university.programTypes.find(p => p.type == pid)
  if (!programType) return
  const stage = programType.studyStages.find(s => s.stage == sid)
  if (!stage) return
  const commissions = stage.commissions
  if (!commissions) return

  let dueDate = new Date(joinYear.value, joinMonth.value)
  if (dueDate == 'Invalid Date') dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[0].installmentDays));

  document.getElementById("Ptype").value = commissions[0].type

  payableDueDateInput.value = `${dueDate.toISOString().slice(0, 10)}`
  switch (commissions[0].type) {
    case 'fixed': {
      payableAmountInput.value = commissions[0].value
      document.getElementById('PCurrency').value = commissions[0].currency
      Pnotes.disabled = false; Pnotes.value = ''
      break;
    }
    case 'percentage': {
      payableAmountInput.value = parseInt(fees * (commissions[0].value / 100))
      document.getElementById('PCurrency').value = document.getElementById('PfeesCurrency').value
      Pnotes.disabled = false; Pnotes.value = ''
      break;
    }
    case 'na': {
      payableAmountInput.value = '0'
      payableAmountInput.disabled = true
      document.getElementById('PCurrency').disabled = true
      document.getElementById('PCurrency').value = ''
      payableDueDateInput.value = ''
      payableDueDateInput.disabled = true
      document.getElementById('Pnotes').disabled = true
      document.getElementById('Pnotes').value = 'N/A commission entry'
    }
  }
}


/**
 * --------------------------------------------------
 * Study Plan
 * --------------------------------------------------
 */


// Remove Study Stage
function removestudyStage(event) {
  const button = event.target;
  const row = button.closest('tr');
  row.remove();
}
window.removestudyStage = removestudyStage;

function getLatestStudyStage() {
  try {
    const uid = universitySelect.value
    const pid = programSelect.value
    const pType = universities[uid].programTypes.find(pt => pt.type == pid)
    const stageIds = pType.studyStages.map(pst => pst.stage)
    return stageIds
  } catch {
    return []
  }
}

// Add Study Stage
function addstudyStage(event) {
  const studyStage = `
    <td class="text-center align-middle">
      <select class="form-select form-select-sm study_stage" required="required">
          <option hidden disabled selected value="">Select Study Stage</option>
      </select>
    </td>
    <td>
      <input class="form-control form-control-sm start_date" type="text" placeholder="YYYY-MM-DD" required="required"/>
    </td>
    <td>
      <select class="form-select form-select-sm status" required="required">
        <option value="Not Started">Not Started</option>
        <option value="Currently Enrolled">Currently Enrolled</option>
        <option value="Completed">Completed</option>
      </select>
    </td>
    <td><input class="form-control form-control-sm notes" type="text"/></td>
    <td class="text-center align-middle"><button class="btn btn-link btn-sm" type="button" onclick="removestudyStage(event)"><span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span></button></td>`

  const button = event.target;
  const table = document.querySelector('table tbody');
  if (table) {
    const newRow = table.insertRow();
    newRow.classList.add('align-middle')
    newRow.innerHTML += studyStage

    const newSelect = newRow.querySelector(".study_stage")

    const stageIds = getLatestStudyStage()
    stageIds.forEach(stageId => {
      let studyStage = studyStages[stageId]
      if (studyStage) {
        let option = document.createElement("option");
        option.value = stageId;
        option.textContent = studyStage.name;
        newSelect.appendChild(option);
      }
    });
  }
}
window.addstudyStage = addstudyStage;

function readStudyPlan() {
  const table = document.getElementById('studyPlan');
  const rows = table.querySelectorAll('tbody tr');
  const data = [];

  for (let i=0; i < rows.length; i++) {
    const row = rows[i]
    const studyStage = row.querySelector('.study_stage').value;
    const startDate = row.querySelector('.start_date').value;
    const status = row.querySelector('.status').value;
    const notes = row.querySelector('.notes').value;
  
    if (!studyStage || !startDate || !status) { failMessage("Please complete Study Plan fields."); return }
    data.push({ studyStage, startDate, status, notes });
  }

  return data
}

/**
 * --------------------------------------------------
 * TWG Learning Plan
 * --------------------------------------------------
 */


// Remove Study Stage
function removeModule(event) {
  const button = event.target;
  const row = button.closest('tr');
  row.remove();
}
window.removeModule = removeModule;

function getLatestModulesList() {
  try {
    const pid = programSelect.value
    const modules = programs[pid]["modules"]
    return modules
  } catch {
    return []
  }
}

// Add Study Stage
function addModule(event) {
  const module = `
    <td>
      <select class="form-select form-select-sm module mb-1" required="required">
        <option hidden disabled selected value="">Select Module</option>
      </select>
    </td>
    <td>
      <select class="form-select form-select-sm result mb-1" required="required">
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
        <option value="withdrawn">Withdrawn</option>
      </select>
    </td>
    <td><input class="form-control form-control-sm grade" type="text" required="required"/></td>
    <td><input class="form-control form-control-sm notes" type="text" required="required"/></td>
    <td class="text-center align-middle"><button class="btn btn-link btn-sm" type="button" onclick="removeModule(event)"><span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span></button></td>`

  const button = event.target;
  const tablePair = button.closest('.Term');
  if (tablePair) {
    const table = tablePair.querySelector('table tbody');
    if (table) {
      const newRow = table.insertRow();
      newRow.classList.add('align-middle')
      newRow.innerHTML += module

      const newSelect = newRow.querySelector(".module")

      const modules = getLatestModulesList()
      modules.forEach(m => {
        let option = document.createElement("option");
        option.value = m;
        option.textContent = m;
        newSelect.appendChild(option);
      });
    }
  }
}
window.addModule = addModule;

// Remove Program Type
function removeTerm(event) {
  const button = event.target;
  const Term = button.closest(".Term")
  Term.remove()
}
window.removeTerm = removeTerm

// Add Program Type
function addTerm(event) {
  const Term = `
    <div class="position-absolute end-0 top-0 mt-2 me-3 z-index-1">
      <button class="btn btn-link btn-sm p-0" type="button" onclick="removeTerm(event)">
        <span class="fas fa-times-circle text-danger" data-fa-transform="shrink-1"></span>
      </button>
    </div>

    <div class="row form-group">
      <div class="col-lg-4 col-12 mb-3">
        <label class="form-label" for="termName">Term Name<span class="text-danger">*</span></label>
        <input class="form-control termName" name="termName" type="text" placeholder="Term X" required="required" />
      </div>
      <div class="col-lg-4 col-12 mb-3">
        <label class="form-label" for="startDate">Start Date<span class="text-danger">*</span></label>
        <input class="form-control startDate" name="startDate" type="text" placeholder="YYYY-MM-DD" required="required" />
      </div>
      <div class="col-lg-4 col-12 mb-3">
        <label class="form-label" for="numberOfModules">Module Count<span class="text-danger">*</span></label>
        <input class="form-control numberOfModules" name="numberOfModules" type="number" required="required" />
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered mt-3 bg-white dark__bg-1100">
        <thead>
          <tr class="fs--1">
            <th>Module Name</th>
            <th>Result</th>
            <th>Grade</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>

    <div class="text-end">
      <button class="btn btn-falcon-default btn-sm mt-2" type="button" onclick="addModule(event)"><span class="fas fa-plus fs--2 me-1" data-fa-transform="up-1"></span>Add Module</button>
    </div>
    `

  const button = event.target;

  // Create a new div element and add classes to it
  const newDiv = document.createElement('div');
  newDiv.classList.add('border', 'rounded-1', 'position-relative', 'bg-white', 'dark__bg-1100', 'p-3', 'mb-3', 'Term');
  newDiv.innerHTML = Term

  button.parentNode.insertBefore(newDiv, button);
}
window.addTerm = addTerm

function readLearningPlan() {
  const termsContainer = document.getElementById('learningPlans');
  const terms = termsContainer.querySelectorAll('.Term');
  const allData = [];

  for (let i=0; i<terms.length; i++) {
    const term = terms[i]
    const termData = {
      name: term.querySelector('.termName').value,
      startDate: term.querySelector('.startDate').value,
      count: term.querySelector('.numberOfModules').value,
      modules: []
    };
  
    if (!termData.name || !termData.startDate || !termData.count) { failMessage("Please complete Term information."); return }
  
    const rows = term.querySelectorAll('tbody tr');
    for (let j=0; j<rows.length; j++) {
      const row = rows[j]
      const name = row.querySelector('.module').value;
      const result = row.querySelector('.result').value;
      const grade = row.querySelector('.grade').value;
      const notes = row.querySelector('.notes').value;
      termData.modules.push({ name, result, grade, notes });
    }
    allData.push(termData);
  }

  return allData
}

/**
 * --------------------------------------------------
 * Event Listeners
 * --------------------------------------------------
 */

window.onload = async () => {
  await fetchData()
  updateAgentList()
  updateProgramsList()
  updateCurrencyList()

  // Enable adding study plan
  const addStudyPlanBtn = document.getElementById("addStudyPlan")
  addStudyPlanBtn.disabled = false
}

submitBtn.onclick = createStudent

sourceSelect.addEventListener("change", () => {
  if (sourceSelect.value === "Agent") {
    agentSelect.disabled = false;
    agentPaymentDetails.classList.remove("d-none")
  } else {
    agentSelect.disabled = true;
    agentPaymentDetails.classList.add("d-none")
  }
});

programSelect.addEventListener("change", () => {
  if (programSelect.value) {
    updateUniversityList(programSelect.value)
  } else {
    universitySelect.disabled = true;
  }
})

universitySelect.addEventListener("change", () => {
  updatestudyStageList()
  updateDegreesOffered()
})

payableRecompute.addEventListener("click", computeComissionPayable)
receivableRecompute.addEventListener("click", computeComissionReceivable)


function discardChanges() {
  if (confirm("Discard all changes?")) {
    location.reload()
  }
}
window.discardChanges = discardChanges
