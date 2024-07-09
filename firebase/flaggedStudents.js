import { updateData, readData } from './helpers.js';

const studentChoiceElement = new Choices(
  document.getElementById('studentListDropdown'),
  {
    removeItems: true,
    removeItemButton: true,
  }
);

const flagChoiceElement = new Choices(
  document.getElementById('flagStatusDropdown'),
  {
    removeItems: true,
    removeItemButton: true,
  }
);

const params = new URLSearchParams(window.location.search);
const selectedStdId = params.get('stdId');
const selectedFlag = params.get('flagStatus');

const flagOptions = [
  { value: 'all', label: 'All', selected: true },
  { value: 'flagged', label: 'Flagged', selected: selectedFlag == 'flagged' },
  {
    value: 'resolved',
    label: 'Resolved',
    selected: selectedFlag == 'resolved',
  },
];
flagChoiceElement.setChoices(flagOptions);

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
  /* Fetches & renders flagged students, Sets students options */
  const tableBody = document.getElementById('table-students-body');
  if (!tableBody) return;
  try {
    const students = await readData('students');
    const studentsOptions = [{ value: 'all', label: 'All', selected: true }];

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
        <td class="resNotes align-middle py-2">{}</td>
        <td class="resolver align-middle py-2">{}</td>
        <td class="status align-middle py-2">
            <button class="{}" data-stdId={} data-flagId={} style="font-size: 0.8rem">{}</button>
        </td>
      </tr>`;

    let csvContent =
      'Student,Email,Flagged For,Flag Notes,Flagged By,Resolution Notes,Resolved By\r\n';
    const csvRow = '{},{},{},{},{},{},{}\r\n';

    for (let stdId in students) {
      const student = students[stdId];
      const { studentName, studentEmail, flags } = student;

      studentsOptions.push({
        value: stdId,
        label: `${studentName} - ${stdId}`,
        selected: stdId === selectedStdId,
      });

      if (selectedStdId && selectedStdId !=='all' && stdId != selectedStdId)
          continue;

      if (!flags) continue;
      for (let flagId in flags) {
        const { flagged, flaggedFor, flagNotes, flaggerName, resolutionNotes, resolvedByName } = flags[flagId];
        if (
          (selectedFlag === 'flagged' && !flagged) ||
          (selectedFlag === 'resolved' && flagged)
        ) {
          continue;
        }

        let row;
        if (flagged) {
          row = schema.format( stdId, stdId, studentName, studentEmail, flaggedFor, flagNotes, flaggerName, resolutionNotes || "-" , resolvedByName || "-" , "btn btn-sm btn-danger unflagBtn", stdId, flagId, "Unflag");
        } else {
          row = schema.format( stdId, stdId, studentName, studentEmail, flaggedFor, flagNotes, flaggerName, resolutionNotes || "-" , resolvedByName || "-" , "badge rounded-pill text-bg-light opacity-50 border border-success border-2 pe-none", stdId, flagId, "Resolved");
        }
        if (tableBody) tableBody.innerHTML += row;

        csvContent += csvRow.format( studentName, studentEmail, flaggedFor, flagNotes, flaggerName, resolutionNotes || "-", resolvedByName || "-");
      }
    }

    studentChoiceElement.setChoices(studentsOptions, 'value', 'label', true);
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

document.getElementById('resolvedById').value = localStorage.getItem('userId');
document.getElementById('resolvedByName').value = localStorage.getItem('userName');

async function openUnflagModal(e) {
  const studentId = e.target.getAttribute('data-stdId');
  const flagId = e.target.getAttribute('data-flagId');
  document.getElementById('studentId').value = studentId;
  document.getElementById('flagId').value = flagId;
  document.getElementById('openUnflagModalBtn').click();
}

const unflagStudentForm = document.getElementById('studentUnflagForm');
unflagStudentForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  processingMessage("Removing flag...");
  try {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const { flagId, studentId, resolvedById, resolvedByName, resolutionNotes } = data;

    if (!studentId?.trim() || !resolvedById?.trim() || !resolvedByName?.trim() ||!resolutionNotes?.trim()) {
      failMessage('Please provided all details!');
      return;
    }

    const dbPath = `students/${studentId}/flags/${flagId}`;
    await updateData(dbPath, {
      flagged: false,
      resolvedById,
      resolvedByName,
      resolutionNotes,
    });

    successMessage('Flagged removed successfully!');
    document.getElementById('closeUnflagModal').click();
    await listFlaggedStudents();
  } catch (error) {
    console.log(error);
    failMessage('Failed to remove flag!');
  }
});
