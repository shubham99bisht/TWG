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
const feesInput = document.getElementById("fees")
const studentIdInput = document.getElementById("studentId")
const joinDateInput = document.getElementById("joinDate")

const receiveDueDateInput = document.getElementById("RdueDate")
const receiveAmountInput = document.getElementById("Ramount")

const payableDueDateInput = document.getElementById("PdueDate")
const payableAmountInput = document.getElementById("Pamount")

// Global Variables
let programs = {}, universities = {}, agents = {}, AGENT_COMMISSION_RATE = 10


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
    studentId, joinDate, studentName,
    email, phone, address
  } = basicInfoData

  const {
    program_type, university, source, agent, fees
  } = enrollmentInfoData

  if (
    !studentId || !studentName || !phone || !email || !address ||
    !source || !program_type || !university || !fees
  ) { failMessage("Please provide all data"); return }
  if (source == "Agent" && !agent) { failMessage("Agent Info missing!"); return }

  await createReceivable(studentId, university)
  const newStudent = {
    joinDate, name: studentName, email, phone, address,
    program_type, university, source, fees
  }
  if (source == "Agent") {
    newStudent["agent"] = agent
    await createPayable(studentId, agent)
  }
  
  const oldStudent = await readData(`students/${studentId}`)
  if (oldStudent) {
    failMessage("Student Id already exists!")
    return
  }

  writeData(`students/${studentId}`, newStudent)
    .then((result) => {
      if (result) {
        successMessage("Student added successfully!")
          .then(() => location.href = 'students.html')
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error adding student");
    });
}

async function createReceivable(student, university) {
  const receivableFormData = Object.fromEntries(new FormData(receivableForm));
  writeDataWithNewId(`receivable`, {
    ...receivableFormData, student, university
  })
}

async function createPayable(student, agent) {
  const payableFormData = Object.fromEntries(new FormData(payableForm));
  writeDataWithNewId('payable', {
    ...payableFormData, student, agent
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
  AGENT_COMMISSION_RATE = await readData("AGENT_COMMISSION_RATE")
}

function updateAgentList() {
  agentSelect.innerHTML = '<option>Select an agent</option>'
  for (const id in agents) {
    const option = document.createElement("option");
    option.id = id;
    option.value = id;
    option.textContent = agents[id].name;
    agentSelect.appendChild(option);
  }
}

function updateProgramsList() {
  programSelect.innerHTML = '<option>Select a program type</option>'
  for (const id in programs) {
    const option = document.createElement("option");
    option.id = id;
    option.value = id;
    option.textContent = programs[id].name;
    programSelect.appendChild(option);
  }
}

function updateUniversityList(pId) {
  universitySelect.innerHTML = '<option>Select a university</option>'
  for (const id in universities) {
    if (universities[id].program_types.includes(pId)) {
      const option = document.createElement("option");
      option.id = id;
      option.value = id;
      option.textContent = universities[id].name;
      universitySelect.appendChild(option);
    }
  }
}

function computeComissionReceivable() {
  const fees = feesInput.value || 0;
  const program = programs[programSelect.value];

  if (!program) return
  
  let dueDate = new Date(joinDateInput.value)
  if (dueDate == 'Invalid Date') dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + program.first_installment);

  receiveDueDateInput.value = `${dueDate.getFullYear()}-${dueDate.getMonth()+1}-${dueDate.getDate()}`
  receiveAmountInput.value = fees * (program.commission_rate/100)
}

function computeComissionPayable() {
  const fees = feesInput.value || 0;
  // const agent = agents[agentSelect.value];

  let dueDate = new Date(joinDateInput.value)
  if (dueDate == 'Invalid Date') dueDate = new Date()
  dueDate.setDate(dueDate.getDate());

  payableDueDateInput.value = `${dueDate.getFullYear()}-${dueDate.getMonth()+1}-${dueDate.getDate()}`
  payableAmountInput.value = fees * (AGENT_COMMISSION_RATE/100)
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
    universitySelect.disabled = false;

    feesInput.disabled = false;
    computeComissionReceivable()
  } else {
    feesInput.disabled = true
    universitySelect.disabled = true;
  }
})

agentSelect.addEventListener("change", () => {
  computeComissionPayable()
})

feesInput.addEventListener("change", () => {
  computeComissionReceivable()
  computeComissionPayable()
})
