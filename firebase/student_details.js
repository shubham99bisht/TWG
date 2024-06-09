import { deleteData, updateData, writeDataWithNewId, writeData } from "./helpers.js";

const params = new URLSearchParams(document.location.search);
const studentId = params.get('id')
if (!studentId) location.href = "students.html"

// Forms
const updateFeePayableForm = document.getElementById("updateFeePayableForm")
const updateStudyPlanForm = document.getElementById("studyPlanForm");
const updateTwgModuleForm = document.getElementById("updateTwgModuleForm");
const editTwgForm = document.getElementById("editTwgTermForm");

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
            if (writeDataWithNewId(`students/${studentId}/studyPlan`, { notes, startDate, status, studyStage })) {
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
            if (await deleteData(`students/${studentId}/studyPlan/${id}`)) {
                successMessage('Payment deleted successfully!').then(() => location.reload())
            } else { throw "Not deleted" }
        } catch (e) {
            failMessage('Failed to delete Payment')
            console.error(e)
        }
    }
}
window.removeStudyPlan = removeStudyPlan;

/**
 * --------------------------------------------------
 * Update TWG Learning Plan
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
        const result = formData['twgModuleResult']
        const grade = formData['twgModuleGrade']

        if (!name || !result) {
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
            if (writeDataWithNewId(`students/${studentId}/learningPlan/${termId}/modules`, { name, notes, result, grade })) {
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

async function removeTerm(termId) {
    if (confirm("Confirm delete TWG Term?")) {
        try {
            if (await deleteData(`students/${studentId}/learningPlan/${termId}`)) {
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
        if (writeDataWithNewId(`students/${studentId}/learningPlan`, learningPlan)) {
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
async function editTwgTerm() {
    try {
        const formProps = new FormData(editTwgForm);
        const formData = Object.fromEntries(formProps);

        const termId = formData['termId'];
        const name = formData['termName']
        const startDate = formData['startDate']
        const count = formData['numberOfModules']

        if (updateData(`students/${studentId}/learningPlan/${termId}`, { name, startDate, count })) {
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
