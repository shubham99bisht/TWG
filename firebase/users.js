import { readData } from "./helpers.js";

const usersList = document.getElementById("usersTable")

const schema = `<div class="px-2">
{} | {} | {} <hr>
</div>`


async function loadUsers() {
    const users = await readData('users')
    usersList.innerHTML = ''

    for (let userId in users) {
        const u = users[userId]
        const row = schema.format(
            u?.name || 'Anonymous',
            u?.email, u?.role
        )

        usersList.innerHTML += row
    }
}

window.onload  = loadUsers
