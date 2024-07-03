import { updateData, readFlaggedStudents } from './helpers.js';

window.onload = async () => {
  processingMessage('Fetching flagged students...');
  await listFlaggedStudents();
  closeSwal();
};

/**
 * --------------------------------------------------
 * Flagged Students Fetch
 * --------------------------------------------------
 */

async function listFlaggedStudents() {
  const tableBody = document.getElementById('table-students-body');
  if (!tableBody) return;

  try {
    const students = await readFlaggedStudents();

    tableBody.innerHTML = '';
    const schema = `<tr class="btn-reveal-trigger">
        <td class="id align-middle white-space-nowrap py-2">
          <a href="student_details.html?id={}">{}</a>
        </td>
        <td class="name align-middle white-space-nowrap py-2">
          <h5 class="mb-0 fs--1">{}</h5>
          {}
        </td>
        <td class="flaggedFor align-middle white-space-nowrap py-2 text-capitalize">{}</td>
        <td class="flagNotes align-middle py-2">{}</td>
        <td class="flagger align-middle py-2">{}</td>
        <td class="align-middle white-space-nowrap py-2 text-end">
            <button class="btn btn-sm btn-danger unflagBtn" data-id={}>Unflag</button>
        </td>
      </tr>`;

    let csvContent =
      'Student,Email,Flagged For,Flag Notes,Flagged By\r\n';
    const csvRow = '{},{},{},{},{}\r\n';

    for (let id in students) {
      const student = students[id];
      const { studentName, studentEmail, flagged, flagInfo } = student;
      if (!flagged) continue;

      const { flaggedFor, flagNotes, flaggerName } = flagInfo;

      const row = schema.format( id, id, studentName, studentEmail, flaggedFor, flagNotes, flaggerName, id);
      if (tableBody) tableBody.innerHTML += row;
      csvContent += csvRow.format( studentName, studentEmail, flaggedFor, flagNotes, flaggerName);
    }

    window.csvContent = csvContent;
    listInit();

    const unflagButtons = document.getElementsByClassName('unflagBtn');
    for (let button of unflagButtons) {
      button.addEventListener('click', openUnflagModal);
    }
  } catch (error) {
    console.error('Error reading students:', error);
    if (tableBody)
      tableBody.innerHTML = `<tr class="text-center"><td colspan="6">Student data not found!</td></tr>`;
  }
}
window.listFlaggedStudents = listFlaggedStudents;

/**
 * --------------------------------------------------
 * Unflag student
 * --------------------------------------------------
 */

document.getElementById('unflaggerId').value = localStorage.getItem('userId');
document.getElementById('unflaggerName').value = localStorage.getItem('userName');

async function openUnflagModal(e) {
  const studentId = e.target.getAttribute('data-id');
  document.getElementById('studentId').value = studentId;
  document.getElementById('openUnflagModalBtn').click();
}

const unflagStudentForm = document.getElementById('studentUnflagForm');
unflagStudentForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  processingMessage("Removing flag...");
  try {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const { studentId, unflaggerId, unflaggerName, resolutionNotes } = data;

    if (!studentId?.trim() || !unflaggerId?.trim() || !unflaggerName?.trim() ||!resolutionNotes?.trim()) {
      failMessage('Please provided all details!');
      return;
    }

    let dbPath = `students/${studentId}/`;
    await updateData(dbPath, { flagged: false });

    dbPath = `students/${studentId}/flagInfo`;
    await updateData(dbPath, { unflaggerId, unflaggerName, resolutionNotes });

    successMessage('Flagged removed successfully!');
    document.getElementById('closeUnflagModal').click();
    await listFlaggedStudents();
  } catch (error) {
    console.log(error);
    failMessage('Failed to remove flag!');
  }
});
