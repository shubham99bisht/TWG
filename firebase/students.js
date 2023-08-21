import { readData, deleteData } from "./helpers.js";

/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllStudents() {
  const tableBody = document.getElementById("table-students-body");
  if (!tableBody) return
  readData("students")
    .then((students) => {
      tableBody.innerHTML = ''
      const schema = `<tr class="btn-reveal-trigger">
            <td class="id align-middle white-space-nowrap py-2">{}</td>
            <td class="name align-middle white-space-nowrap py-2">
              <h5 class="mb-0 fs--1"><a href="student_details.html?id={}">{}</a></h5>
            </td>
            <td class="email align-middle py-2">
                <a href="mailto:{}">{}</a> </br>
                {}
            </td>
            <td class="phone align-middle white-space-nowrap py-2">{}</td>
            <td class="program align-middle ps-5 py-2">{}</td>
            <td class="align-middle white-space-nowrap py-2 text-end">
                <div class="dropdown font-sans-serif position-static">
                    <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal" type="button" id="customer-dropdown-0" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false"><span class="fas fa-ellipsis-h fs--1"></span></button>
                    <div class="dropdown-menu dropdown-menu-end border py-0" aria-labelledby="customer-dropdown-0">
                        <div class="py-2">
                            <a class="dropdown-item" href="add_student.html?id={}">Edit</a>
                            <a class="dropdown-item text-danger" onclick="deleteStudent('{}')" style="cursor:pointer">Delete</a>
                        </div>
                    </div>
                </div>
            </td>
        </tr>`

      Object.keys(students).forEach(id => {
        const s = students[id]
        const row = schema.format(id, id, s.name, s.email, s.email, s.phone, s.university, s.program_type, id, id)
        if (tableBody) tableBody.innerHTML += row
      });

      listInit()
    })
    .catch((error) => {
      console.error("Error reading students:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="6">Student data found!</td></tr>`
    });
}
window.listAllStudents = listAllStudents

/**
 * --------------------------------------------------
 * Read Student with id
 * --------------------------------------------------
 */

function readStudentDetails() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get('id')
  if (!id) location.href = "students.html"
  readData(`students/${id}`)
    .then(async (result) => {
      if (!result) failMessage("Student not found!");

      const universityName = await readData(`universities/${result?.university}/name`)
      const programName = await readData(`program_types/${result?.program_type}/name`)

      document.getElementById("student_id").innerHTML = id
      document.getElementById("name").innerHTML = result?.name
      document.getElementById("email").innerHTML = result?.email
      document.getElementById("join_date").innerHTML = result?.join_date
      document.getElementById("phone").innerHTML = result?.phone
      document.getElementById("address").innerHTML = result?.address

      document.getElementById("university").innerHTML = universityName || ''
      document.getElementById("program_type").innerHTML = programName || ''
      document.getElementById("enrollment_type").innerHTML = result?.enrollment_type
      document.getElementById("agent").innerHTML = result?.agent || '-'
      document.getElementById("fees").innerHTML = result?.fees
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error fetching agent");
    });
}
window.readStudentDetails = readStudentDetails

/**
 * --------------------------------------------------
 * Delete Student
 * --------------------------------------------------
 */

function deleteStudent(id) {
  if (confirm(`Confirm delete student with id: ${id}`))
  deleteData(`students/${id}`)
    .then((result) => {
      if (result) {
        successMessage("Agent deleted successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error deleting student");
    });
}
window.deleteStudent = deleteStudent


/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = () => {
  const pageName = window.location.pathname.split('/').pop().split(".html")[0];
  switch (pageName) {
    case "students": {
      listAllStudents();
      break;
    }
    case "student_details": {
      readStudentDetails();
      break;
    }
    case "add_student": {
      // Don't do anything
      // onSubmit eventListener already added
    }
  }
}
