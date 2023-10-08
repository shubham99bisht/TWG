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
let programs = {}, universities = {}, agents = {}, currency = {}, paymentStages = {}


/**
 * --------------------------------------------------
 * Create New Student
 * --------------------------------------------------
 */

async function createStudent() {
  processingMessage()
  const basicInfoData = Object.fromEntries(new FormData(basicInfo));
  const enrollmentInfoData = Object.fromEntries(new FormData(enrollmentInfo));

  const { studentId, joinMonth, joinYear, universityStudentId, studentName } = basicInfoData
  let { program_type, university, source, agent } = enrollmentInfoData
  const date = new Date(joinYear, joinMonth, 2)
  const joinDate = `${date.toISOString().slice(0,10)}`

  // Validation
  if (
    !studentId || !studentName || !joinMonth || !joinYear || !universityStudentId ||
    !source || !program_type || !university
  ) { failMessage("Please provide all data"); return }

  // Verifying old entries
  const oldStudent = await readData(`students/${studentId}`)
  if (oldStudent) {
    failMessage("Student Id already exists!")
    return
  }

  let {stage, status, fees, amount, dueDate, notes } = Object.fromEntries(new FormData(receivableForm));
  if (!stage || !status || !fees || !amount || !dueDate) {
    failMessage("Please provide enteries for Commission Receivable"); return
  } else if (document.getElementById("Rtype").value != 'na') {
    await createReceivable(studentId, university, agent, program_type)
  }

  if (source == "Agent") {
    if (!agent) {failMessage("Agent Info missing!"); return }

    let {stage, status, fees, amount, dueDate, notes } = Object.fromEntries(new FormData(payableForm));
    if (!stage || !status || !fees || !amount || !dueDate) {
      failMessage("Please provide enteries for Commission Payable"); return
    }
    if (document.getElementById("Ptype").value != 'na') {
      await createPayable(studentId, university, agent, program_type)
    }
  } else { agent = '' }

  // Create Student
  const newStudent = {
    studentId, joinDate, universityStudentId, studentName,
    program_type, university, source
  }
  if (source == "Agent") newStudent["agent"] = agent
  console.log(newStudent)

  writeData(`students/${studentId}`, newStudent)
    .then((result) => {
      if (result) {
        successMessage("Student added successfully!")
          .then(() => location.reload())
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error adding student");
    });
}

async function createReceivable(student, university, agent, program_type) {
  const receivableFormData = Object.fromEntries(new FormData(receivableForm));
  if (!receivableFormData.amount) return
  writeDataWithNewId(`receivable`, {
    ...receivableFormData, student, university, agent, program_type
  })
}

async function createPayable(student, university, agent, program_type) {
  const payableFormData = Object.fromEntries(new FormData(payableForm));
  if (!payableFormData.amount) return
  writeDataWithNewId('payable', {
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
  paymentStages = await readData("payment_stages")
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

function updatePaymentStageList() {
  const uid = universitySelect.value
  const pid = programSelect.value

  Pstage.innerHTML = '<option selected disabled>Select stage</option>'
  Rstage.innerHTML = '<option selected disabled>Select stage</option>'

  const pType = universities[uid].programTypes.find(pt => pt.type == pid)
  if (!pType) return

  console.log(pType)

  const stageIds = pType.paymentStages.map(pst => pst.stage)
  stageIds.forEach(stageId => {
    let paymentStage = paymentStages[stageId]
    if (paymentStage) {
      let option = document.createElement("option");
      option.value = stageId;
      option.textContent = paymentStage.name;
      Pstage.appendChild(option);

      option = document.createElement("option");
      option.value = stageId;
      option.textContent = paymentStage.name;
      Rstage.appendChild(option);
    }
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
  const stage = programType.paymentStages.find(s => s.stage == sid)
  if (!stage) return
  const commissions = stage.commissions
  if (!commissions) return
  
  let dueDate = new Date(joinYear.value, joinMonth.value)
  if (dueDate == 'Invalid Date') dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[1].installmentDays));

  document.getElementById("Rtype").value = commissions[1].type

  receiveDueDateInput.value = `${dueDate.toISOString().slice(0,10)}`
  switch (commissions[1].type) {
    case 'fixed': {
      receiveAmountInput.value = commissions[1].value
      document.getElementById('RCurrency').value = commissions[1].currency
      Rnotes.disabled = false; Rnotes.value = ''
      break;
    }
    case 'percentage': {
      receiveAmountInput.value = parseInt(fees * (commissions[1].value/100))
      document.getElementById('RCurrency').value = document.getElementById('RfeesCurrency').value
      Rnotes.disabled = false; Rnotes.value = ''
      break;
    }
    case 'na': {
      receiveAmountInput.value = ''
      receiveAmountInput.disabled = true
      Rcurrency.disabled = true
      Rcurrency.value = ''
      receiveDueDateInput.value = ''
      receiveDueDateInput.disabled = true
      Rnotes.disabled = true
      Rnotes.value = 'No commission entry will be added'      
      
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
  const stage = programType.paymentStages.find(s => s.stage == sid)
  if (!stage) return
  const commissions = stage.commissions
  if (!commissions) return

  let dueDate = new Date(joinYear.value, joinMonth.value)
  if (dueDate == 'Invalid Date') dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + parseInt(commissions[0].installmentDays));

  document.getElementById("Ptype").value = commissions[0].type
  
  payableDueDateInput.value = `${dueDate.toISOString().slice(0,10)}`
  switch (commissions[0].type) {
    case 'fixed': {
      payableAmountInput.value = commissions[0].value
      document.getElementById('PCurrency').value = commissions[0].currency
      Pnotes.disabled = false; Pnotes.value = ''
      break;
    }
    case 'percentage': {
      payableAmountInput.value = parseInt(fees * (commissions[0].value/100))
      document.getElementById('PCurrency').value = document.getElementById('PfeesCurrency').value
      Pnotes.disabled = false; Pnotes.value = ''
      break;
    }
    case 'na': {
      payableAmountInput.value = ''
      payableAmountInput.disabled = true
      document.getElementById('PCurrency').disabled = true
      document.getElementById('PCurrency').value = ''
      payableDueDateInput.value = ''
      payableDueDateInput.disabled = true
      document.getElementById('Pnotes').disabled = true
      document.getElementById('Pnotes').value = 'No commission entry will be added'
    }
  }
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
  updatePaymentStageList()
})

payableRecompute.addEventListener("click", computeComissionPayable)
receivableRecompute.addEventListener("click", computeComissionReceivable)


function discardChanges() {
  if (confirm("Discard all changes?")) {
    location.reload()
  }
}
window.discardChanges = discardChanges
