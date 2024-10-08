import { deleteData, deleteArrayData, updateData, writeDataWithNewId, readData, updateFilteredCommissions } from "./helpers.js";

const params = new URLSearchParams(document.location.search);
const studentId = params.get('id')
if (!studentId) location.href = "students.html"

// Forms
const updateFeePayableForm = document.getElementById("updateFeePayableForm")
const updateStudyPlanForm = document.getElementById("studyPlanForm");
const updateTwgModuleForm = document.getElementById("updateTwgModuleForm");
const editTwgForm = document.getElementById("editTwgTermForm");

// // Select Options
const agentSelect = document.getElementById("agent_select")
const programSelect = document.getElementById("program_type_select")
const universitySelect = document.getElementById("university_select")
const degreeSelect = document.getElementById("degree_select")

// Global Variables
let programs = {}, universities = {}, agents = {}

/**
 * --------------------------------------------------
 * Event Listeners
 * --------------------------------------------------
 */

async function fetchStudentDetailsData() {
  programs = await readData("program_types")
  universities = await readData("universities")
  agents = await readData("agents")

  updateAgentList()
  updateProgramsList()
}
window.fetchStudentDetailsData = fetchStudentDetailsData

/**
 * --------------------------------------------------
 * Update Student Enrollment Details
 * --------------------------------------------------
 */

function updateAgentList() {
  agentSelect.innerHTML = '<option selected disabled>Select an agent</option>'
  for (const id in agents) {
    const option = document.createElement("option");
    option.id = id;
    option.value = id;
    option.textContent = `${agents[id]?.name} [${id}]`;
    agentSelect.appendChild(option);
  }
  agentSelect.removeAttribute("disabled")
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
  programSelect.removeAttribute("disabled")
}

function updateUniversityList(pId) {
  universitySelect.innerHTML = '<option selected disabled>Select a university</option>'
  for (const id in universities) {

    const univ = universities[id]
    const pTypes = univ.programTypes.map(p => p.type)
    if (!pTypes.includes(programSelect.value)) continue;
    
    const option = document.createElement("option");
    option.id = id;
    option.value = id;
    option.textContent = universities[id].name;
    universitySelect.appendChild(option);
  }
  universitySelect.removeAttribute("disabled")
}

function updateDegreeList(uId) {
    degreeSelect.innerHTML = '<option selected disabled>Select a degree</option>'
    const univ = universities[uId]
    for (let degree of univ?.degrees) {
        const option = document.createElement("option");
        option.value = degree;
        option.textContent = degree;
        degreeSelect.appendChild(option);
    }
    degreeSelect.removeAttribute("disabled")
}

programSelect.addEventListener("change", (event) => {
    const pId = event.target.value;
    updateUniversityList(pId);
})

universitySelect.addEventListener("change", (event) => {
    const uId = event.target.value;
    updateDegreeList(uId);
})


updateUniversityDetailsBtn.addEventListener("click", async () => {
    if (confirm("Confirm updating student University details")) {
        const formProps = new FormData(updateUniversityForm);
        const formData = Object.fromEntries(formProps);
        const { program_type_select: program_type, university_select: university, degree_select: universityDegree } = formData
        const agent = document.getElementById('agentId').value || ''

        // Update Receivable
        await updateFilteredCommissions(studentId, university, agent)

        if (await updateData(`students/${studentId}`, { agent, program_type, university, universityDegree })) {
            successMessage("Student University details updated!").then(() => location.reload())
        } else {
            failMessage("Student University details failed.")
        }        
    }
})

updateAgentDetailsBtn.addEventListener("click", async () => {
    if (confirm("Confirm updating Agent")) {
        const formProps = new FormData(updateAgentForm);
        const formData = Object.fromEntries(formProps);
        const { agent_select: agent } = formData
        const university = document.getElementById('universityId').value || ''

        // Update Receivable
        await updateFilteredCommissions(studentId, university, agent)

        if (await updateData(`students/${studentId}`, { agent, university })) {
            successMessage("Agent updated!").then(() => location.reload())
        } else {
            failMessage("Agent update failed.")
        }        
    }
})


/**
 * --------------------------------------------------
 * Fee Payable
 * --------------------------------------------------
 */

const feepayableModel = document.getElementById('feepayable')
feepayableModel.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget

    if (button.id == 'addFeePayable') {
        updateFeePayableForm.reset();
    }
    else {
        const row = button.closest('tr')
        feepayableModel.querySelector('#feePayableId').value = row.id
        feepayableModel.querySelector('#feePayableAmount').value = row?.querySelector('.amount').textContent || ''
        feepayableModel.querySelector('#feePayableDate').value = row?.querySelector('.date').textContent || ''
        feepayableModel.querySelector('#feePayableNotes').value = row?.querySelector('.notes').textContent || ''
    }
})

async function updateFeePayable() {
    try {
        const formProps = new FormData(updateFeePayableForm);
        const formData = Object.fromEntries(formProps);

        const id = formData['feePayableId']
        const amount = formData['feePayableAmount']
        const date = formData['feePayableDate']
        const notes = formData['feePayableNotes']

        if (!amount || !date) {
            failMessage("Failed to update payment details. Missing fields.");
            return
        }

        if (id) {
            if (updateData(`students/${studentId}/feePayable/${id}`, { amount, date, notes })) {
                successMessage("Payment details updated!").then(() => location.reload())
            } else {
                failMessage("Payment update failed.")
            }
        } else {
            if (writeDataWithNewId(`students/${studentId}/feePayable`, { amount, date, notes })) {
                successMessage("Payment details updated!").then(() => location.reload())
            } else {
                failMessage("Payment update failed.")
            }
        }
    } catch (e) {
        failMessage("Failed to update payment details")
    }
}
window.updateFeePayable = updateFeePayable

async function removeFeePayable(id) {
    if (confirm("Confirm delete payment?")) {
        try {
            if (await deleteData(`students/${studentId}/feePayable/${id}`)) {
                successMessage('Payment deleted successfully!').then(() => location.reload())
            } else { throw "Not deleted" }
        } catch (e) {
            failMessage('Failed to delete Payment')
            console.error(e)
        }
    }
}
window.removeFeePayable = removeFeePayable

const newPaymentDetailsModal = document.getElementById('newPaymentDetailsModal')
const currencyInput = document.getElementById("newPaymentcurrency")
const feesCurrencyInput = document.getElementById("newPayment_fees_currency")
newPaymentDetailsModal.addEventListener('show.bs.modal', async event => {
    const button = event.relatedTarget
    newPaymentDetailsForm.reset()
    try {
        document.getElementById('newPaymentDetailsModalHeader').innerHTML = button.id == "payableNewPayment" ? "New Payable" : "New Receivable";
        document.getElementById('newPayable').innerHTML = button.id == "payableNewPayment" ? "Add Payable" : "Add Receivable";
        updateStudyPlanStageListById(studentId, 'newPaymentstage');
        let currency = await readData("currency_types")
        let currency_options = ''
        Object.keys(currency).forEach(key => {
            currency_options += `<option value='${key}'>${currency[key]?.name}</option>`
        })
        if (currencyInput) {
            currencyInput.innerHTML = currency_options
            feesCurrencyInput.innerHTML = currency_options
        }
        document.getElementById('newPayableCommisionType').value = button.id == "payableNewPayment" ? "payable" : "receivable";
    } catch (error) {
        console.log(error)
        failMessage('Failed to Open payment form')
    }

})

async function newPayable() {
    try {
        const formProps = new FormData(newPaymentDetailsForm);
        const formData = Object.fromEntries(formProps);
        const stage = formData['newPaymentstage']
        const fees = formData['fees']
        const feesCurrency = formData['feesCurrency']
        const dueDate = formData['dueDate']
        const amount = formData['amount']
        const newStatus = formData['newStatus']
        const currency = formData['currency']
        const CommissionType = formData['newPayableCommisionType'];
        const student = studentId;
        const result = await readData(`students/${student}`)
        const program_type = result?.program_type
        const university = result?.university
        const agent = result.agent ? result.agent : '';

        if (!stage || !fees || !feesCurrency || !dueDate || !amount || !newStatus) {
            failMessage("Please provide all inputs")
            return
        }

        if (await writeDataWithNewId(`${CommissionType}`, {
            stage, fees, feesCurrency, dueDate, amount, status: newStatus, currency, notes: '', student, agent, university, program_type
        })) {
            successMessage('Payment status updated!').then(() => location.reload())
        }

    } catch (e) {
        failMessage('Failed to update payment status')
        console.error(e)
    }
}
window.newPayable = newPayable

/**
 * --------------------------------------------------
 * Update Study Plan
 * --------------------------------------------------
 */

const studyPlanModal = document.getElementById('studyPlanModal')
studyPlanModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    updateStudyPlanStageList(studentId)
    if (button.id == 'addStudyPlan') {
        updateStudyPlanForm.reset();
    }
    else {
        const row = button.closest('tr')
        studyPlanModal.querySelector('#studyPlanId').value = row.id

        for (var i = 0; i < studyPlanModal.querySelector('#studyPlanStage').options.length; i++) {
            if (studyPlanModal.querySelector('#studyPlanStage').options[i].innerHTML === row?.querySelector('.name').textContent) {
                studyPlanModal.querySelector('#studyPlanStage').options[i].selected = true;
            }
        }
        studyPlanModal.querySelector('#studyPlanDate').value = row?.querySelector('.date').textContent || ''
        studyPlanModal.querySelector('#studyPlanStatus').value = row?.querySelector('.status').textContent || ''
        studyPlanModal.querySelector('#studyPlanNotes').value = row?.querySelector('.notes').textContent || ''
    }
})

async function updateStudyPlan() {
    try {
        const formProps = new FormData(updateStudyPlanForm);
        const formData = Object.fromEntries(formProps);

        const id = formData['studyPlanId']
        const studyStage = formData['studyPlanStage']
        const startDate = formData['studyPlanDate']
        const status = formData['studyPlanStatus']
        const notes = formData['studyPlanNotes']

        if (!studyStage || !startDate) {
            failMessage("Failed to update Study Plan. Missing fields.");
            return
        }

        if (id) {
            if (updateData(`students/${studentId}/studyPlan/${id}`, { notes, startDate, status, studyStage })) {
                successMessage("Study Plan updated!").then(() => location.reload())
            } else {
                failMessage("Study Plan failed.")
            }
        } else {
            const studentStudyPlan = await readData(`students/${studentId}/studyPlan`)
            const newId = studentStudyPlan?.length || 0
            if (updateData(`students/${studentId}/studyPlan/${newId}`, { notes, startDate, status, studyStage })) {
                successMessage("Study Plan updated!").then(() => location.reload())
            }
            else {
                failMessage("Study Plan failed.")
            }
        }

    } catch (error) {
        failMessage("Failed to update Study Plan")
    }
}
window.updateStudyPlan = updateStudyPlan

async function removeStudyPlan(id) {
    if (confirm("Confirm delete study plan?")) {
        try {
            if (await deleteArrayData(`students/${studentId}/studyPlan`, id)) {
                successMessage('Study plan successfully!').then(() => location.reload())
            } else { throw "Not deleted" }
        } catch (e) {
            failMessage('Failed to delete study plan')
            console.error(e)
        }
    }
}
window.removeStudyPlan = removeStudyPlan;

/**
 * --------------------------------------------------
 * Update TWG Learning Plan - Modules
 * --------------------------------------------------
 */

const twgTermModuleModal = document.getElementById('twgTermModuleModal')
twgTermModuleModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const termId = button.closest('div');
    updateModuleList()
    if (button.id == 'addModule') {
        updateTwgModuleForm.reset();
        twgTermModuleModal.querySelector('#termId').value = termId?.querySelector('#termId').value;
    }
    else {
        const row = button.closest('tr')

        twgTermModuleModal.querySelector('#moduleId').value = row.id
        twgTermModuleModal.querySelector('#termId').value = termId?.querySelector('#termId').value;
        twgTermModuleModal.querySelector('#twgModuleName').value = row?.querySelector('.name').textContent || ''
        twgTermModuleModal.querySelector('#twgModuleNotes').value = row?.querySelector('.notes').textContent || ''
        twgTermModuleModal.querySelector('#twgModuleResult').value = row?.querySelector('.result').textContent || ''
        twgTermModuleModal.querySelector('#twgModuleGrade').value = row?.querySelector('.grade').textContent || ''
    }
})

async function updateModule() {
    try {
        const formProps = new FormData(updateTwgModuleForm);
        const formData = Object.fromEntries(formProps);

        const moduleId = formData['moduleId']
        const termId = formData['termId'];
        const name = formData['twgModuleName']
        const notes = formData['twgModuleNotes']
        const result = formData['twgModuleResult'] || ''
        const grade = formData['twgModuleGrade'] || ''

        if (!name) {
            failMessage("Failed to update Learning Plan. Missing fields.");
            return
        }

        if (!termId) {
            failMessage("Some Error Occured");
            return
        }

        if (moduleId) {
            if (updateData(`students/${studentId}/learningPlan/${termId}/modules/${moduleId}`, { name, notes, result, grade })) {
                successMessage("Learning Plan updated!").then(() => location.reload())
            } else {
                failMessage("Learning Plan failed.")
            }
        } else {
            const moduleList = await readData(`students/${studentId}/learningPlan/${termId}/modules`);
            const newModuleId = moduleList?.length || 0
            if (updateData(`students/${studentId}/learningPlan/${termId}/modules/${newModuleId}`, { name, notes, result, grade })) {
                successMessage("Learning Plan updated!").then(() => location.reload())
            }
            else {
                failMessage("Learning Plan failed.")
            }
        }

    } catch (error) {
        failMessage("Failed to update Learning Plan")
    }
}
window.updateModule = updateModule

async function removeModule(termId, id) {
    if (confirm("Confirm delete Learning plan module?")) {
        try {
            if (await deleteData(`students/${studentId}/learningPlan/${termId}/modules/${id}`)) {
                successMessage('Learning Plan Module deleted successfully!').then(() => location.reload())
            } else { throw "Not deleted" }
        } catch (e) {
            failMessage('Failed to delete Learning Plan Module')
            console.error(e)
        }
    }
}
window.removeModule = removeModule;

/**
 * --------------------------------------------------
 * Update TWG Learning Plan - Terms
 * --------------------------------------------------
 */

async function removeTerm(termId) {
    if (confirm("Confirm delete TWG Term?")) {
        try {
            if (await deleteArrayData(`students/${studentId}/learningPlan/`, termId)) {
                successMessage('TWG Term deleted successfully!').then(() => location.reload())
            } else { throw "Not deleted" }
        } catch (e) {
            failMessage('Failed to delete TWG Term')
            console.error(e)
        }
    }
}
window.removeTerm = removeTerm;

async function addTwgTerm() {
    try {
        const learningPlan = readLearningPlan();
        const currentLearningPlan = await readData(`students/${studentId}/learningPlan`)
        const newId = currentLearningPlan?.length || 0

        if(!learningPlan){return }

        if (updateData(`students/${studentId}/learningPlan/${newId}`, learningPlan)) {
            successMessage("TWG term updated!").then(() => location.reload())
        }
        else {
            failMessage("TWG term failed.")
        }

    } catch (error) {
        failMessage("Failed to update TWG term")
    }
}
window.addTwgTerm = addTwgTerm

async function editTwgTerm() {
    try {
        const formProps = new FormData(editTwgForm);
        const formData = Object.fromEntries(formProps);

        const termId = formData['termId'];
        const name = formData['termName']
        const startDate = formData['startDate']
        const count = formData['numberOfModules']

        const studentLearningPlan = await readData(`students/${studentId}/learningPlan/`)
        for (let i=0; i<studentLearningPlan.length; i++) {
            if (termId == i) continue
            if (studentLearningPlan[i].startDate == startDate) {
                failMessage("Start Date can't be repeated.");
                return
            }
        }

        if (await updateData(`students/${studentId}/learningPlan/${termId}`, { name, startDate, count })) {
            successMessage("TWG term updated!").then(() => location.reload())
        }
        else {
            failMessage("TWG term failed.")
        }

    } catch (error) {
        failMessage("Failed to update TWG term")
    }
}
window.editTwgTerm = editTwgTerm

const twgTermEditModal = document.getElementById('twgTermEditModal')
twgTermEditModal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const termId = button.parentElement.parentElement;
    const parentDiv = termId.parentElement.querySelector('.form-group');
    twgTermEditModal.querySelector('#termId').value = termId?.querySelector('#termId').value;
    twgTermEditModal.querySelector('#termName').value = parentDiv?.querySelector('.termName').value || ''
    twgTermEditModal.querySelector('#startDate').value = parentDiv?.querySelector('.startDate').value || ''
    twgTermEditModal.querySelector('#numberOfModules').value = parentDiv?.querySelector('.numberOfModules').value || ''
})


/**
 * --------------------------------------------------
 * Flag Student
 * --------------------------------------------------
 */

document.getElementById('flaggerId').value = localStorage.getItem('userId');
document.getElementById('flaggerName').value = localStorage.getItem('userName');

const flagForm = document.getElementById('studentFlagForm');
flagForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  processingMessage('Flagging student...');
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  const { flaggerId, flaggerName, flaggedFor, flaggedDate, flagNotes } = data;

  if (!flaggerId?.trim() || !flaggerName?.trim() ||!flaggedFor?.trim() ||!flaggedDate?.trim() ||!flagNotes?.trim()) {
    failMessage('Please provided all details!');
    return;
  }

  try {
    const dbPath = `students/${studentId}/flags`;
    await writeDataWithNewId(dbPath, { flagged: true, flaggerId, flaggerName, flaggedFor, flaggedDate, flagNotes });

    document.getElementById('closeFlagModal').click();
    successMessage('Student flagged successfully!');
  } catch (error) {
    console.log(error);
    failMessage('Failed to flag student');
  }
});

const learningInfoForm = document.getElementById('learningInfoForm');
learningInfoForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  processingMessage('Updating learning plan info...');
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  const { totalFeePayable, totalModules, overallGradeTWG } = data;

  try {
    await updateData(`students/${studentId}`, {
      totalFeePayable,
      totalModules,
      overallGradeTWG,
    })
    successMessage('Updated learning plan info!').then(() => location.reload())
  } catch (error) {
    console.log(error);
    failMessage('Failed to update learning plan info!');
  }
});

