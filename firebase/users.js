import { readData, updateData } from "./helpers.js";

/**
 * Display Users List
 */

const usersList = document.getElementById("table-users-body")

const tableRowSchema = `<tr class="btn-reveal-trigger" id="{}">
    <td class="align-middle">{}</td>
    <td class="align-middle name">{}</td>
    <td class="align-middle email">{}</td>
    <td class="align-middle team">{}</td>
    <td class="align-middle white-space-nowrap text-end">
        <a data-bs-toggle="modal" data-bs-target="#update-user-modal" style="cursor:pointer">
            <span class="fas fa-edit"></span>
        </a>
    </td>
</tr>`


async function loadUsers() {
  const users = await readData('users')
  usersList.innerHTML = ''

  let count = 0
  for (let userId in users) {
    count += 1
    const u = users[userId]
    const row = tableRowSchema.format(
      userId, count,
      u?.name || 'Anonymous',
      u?.email, u?.role
    )

    usersList.innerHTML += row
  }
  listInit()
}

window.onload = loadUsers

/**
 * --------------------------------------------------
 * Update Payment Details
 * --------------------------------------------------
 */

const updateUserModal = document.getElementById('update-user-modal')
updateUserModal.addEventListener('show.bs.modal', event => {
  const button = event.relatedTarget
  const row = button.closest('tr')

  updateUserModal.querySelector('#userId').value = row.id
  updateUserModal.querySelector('#userName').value = row?.querySelector('.name').textContent
  updateUserModal.querySelector('#userEmail').value = row?.querySelector('.email').textContent
  updateUserModal.querySelector('#role').value = row?.querySelector('.role').textContent
})

async function updateUser() {
  try {
    const formProps = new FormData(updateUserForm);
    const formData = Object.fromEntries(formProps);
    const id = formData['userId']
    const role = formData['role']

    if (!id || !role) failMessage("Failed to update user details")
    if (updateData(`users/${id}`, { role })) {
      successMessage("User role updated!").then(() => location.reload())
    } else {
      failMessage("Failed to update user role")
    }
  } catch (e) {
    console.log(e)
    failMessage("Failed to update User role")
  }
}
window.updateUser = updateUser
