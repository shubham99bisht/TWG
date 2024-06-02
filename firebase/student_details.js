import { deleteData, updateData, writeDataWithNewId } from "./helpers.js";

const params = new URLSearchParams(document.location.search);
const studentId = params.get('id')
if (!studentId) location.href = "students.html"

// Forms
const updateFeePayableForm = document.getElementById("updateFeePayableForm")

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
        feepayableModel.querySelector('#feePayableNotes').value =  row?.querySelector('.notes').textContent || ''
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
            if (updateData(`students/${studentId}/feePayable/${id}`, {amount, date, notes})) {
                successMessage("Payment details updated!").then(() => location.reload())
            } else {
                failMessage("Payment update failed.")
            }
        } else {
            if (writeDataWithNewId(`students/${studentId}/feePayable`, {amount, date, notes})) {
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
        updateFeePayableForm.reset();
    }
    else {
        const row = button.closest('tr')
        studyPlanModal.querySelector('#studyPlanId').value = row.id
        studyPlanModal.querySelector('#studyPlanStage').value = row?.querySelector('.name').textContent || ''
        studyPlanModal.querySelector('#studyPlanDate').value = row?.querySelector('.date').textContent || ''
        studyPlanModal.querySelector('#studyPlanStatus').value = row?.querySelector('.status').textContent || ''
        studyPlanModal.querySelector('#feePayableNotes').value =  row?.querySelector('.notes').textContent || ''
    }
})

async function updateStudyPlan() {

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
window.removeStudyPlan = removeStudyPlan
