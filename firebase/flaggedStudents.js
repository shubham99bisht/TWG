import { readData, updateData } from './helpers.js';

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
    const students = await readData('students');

    tableBody.innerHTML = '';
    const schema = `<tr class="btn-reveal-trigger">
              <td class="id align-middle white-space-nowrap py-2">
                <input type="checkbox" class="form-check-input flag-checkbox" data-id={} checked />
              </td>
              <td class="id align-middle white-space-nowrap py-2">
                <a href="student_details.html?id={}">{}</a>
              </td>
              <td class="name align-middle white-space-nowrap py-2">
                <h5 class="mb-0 fs--1">{}</h5>
                {}
              </td>
              <td class="align-middle white-space-nowrap py-2">{}</td>
              <td class="align-middle py-2">{}</td>
              <td class="align-middle py-2">{}</td>
              <td class="align-middle py-2">{}</td>
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
          </tr>`;

    let csvContent =
      'Student,Email,Flagged For,Flag Notes,Resolution Notes, Flagged By\r\n';
    const csvRow = '{},{},{},{},{},{}\r\n';

    for (let id in students) {
      const student = students[id];
      const { studentName, studentEmail, flagged, flagInfo } = student;
      if (!flagged) continue;

      const { flaggedFor, flagNotes, resolutionNotes, flaggedBy } = flagInfo;
      let flaggerName;

      const flagger = await readData(`users/${flaggedBy}`);
      flaggerName = flagger?.name;

      const row = schema.format(
        id,
        id,
        id,
        studentName,
        studentEmail,
        flaggedFor,
        flagNotes,
        resolutionNotes,
        flaggerName,
        id
      );

      if (tableBody) tableBody.innerHTML += row;

      csvContent += csvRow.format(
        studentName,
        studentEmail,
        flaggedFor,
        flagNotes,
        resolutionNotes,
        flaggerName
      );
    }

    window.csvContent = csvContent;
    listInit();

    const flagCheckboxes = document.getElementsByClassName('flag-checkbox');
    for (let checkbox of flagCheckboxes) {
      checkbox.addEventListener('click', unflagStudent);
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
      let dbPath = `students/${studentId}/`;
      await updateData(dbPath, { flagInfo: {} });
      dbPath = `students/${studentId}/`;
      await updateData(dbPath, { flagged: false });
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
