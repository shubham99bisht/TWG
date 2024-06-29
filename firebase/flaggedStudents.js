import { readData, updateData, readFlaggedStudents } from './helpers.js';

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
        <td class="resNotes align-middle py-2">{}</td>
        <td class="flagger align-middle py-2">{}</td>
        <td class="align-middle white-space-nowrap py-2 text-end">
            <button class="btn btn-sm btn-danger unflagBtn" data-id={}>Unflag</button>
        </td>
      </tr>`;

    let csvContent =
      'Student,Email,Flagged For,Flag Notes,Resolution Notes, Flagged By\r\n';
    const csvRow = '{},{},{},{},{},{}\r\n';

    for (let id in students) {
      const student = students[id];
      const { studentName, studentEmail, flagged, flagInfo } = student;
      if (!flagged) continue;

      const { flaggedFor, flagNotes, resolutionNotes, flaggerName } = flagInfo;

      const row = schema.format( id, id, studentName, studentEmail, flaggedFor, flagNotes, resolutionNotes, flaggerName, id);
      if (tableBody) tableBody.innerHTML += row;
      csvContent += csvRow.format( studentName, studentEmail, flaggedFor, flagNotes, resolutionNotes, flaggerName);
    }

    window.csvContent = csvContent;
    listInit();

    const unflagButtons = document.getElementsByClassName('unflagBtn');
    for (let button of unflagButtons) {
      button.addEventListener('click', unflagStudent);
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

async function unflagStudent(e) {
  const isConfirm = confirm('Are you sure to remove the flag?');
  const studentId = e.target.getAttribute('data-id');
  if (isConfirm) {
    processingMessage("Unflagging student...");
    try {
      const dbPath = `students/${studentId}/`;
      await updateData(dbPath, { flagInfo: {}, flagged: false });
      await listFlaggedStudents();
      successMessage("Flag removed successfully");
    } catch (error) {
      console.log(error);
      failMessage('Failed to remove flag!');
    }
  } else {
    e.target.checked = true;
  }
}