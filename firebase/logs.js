import { readData } from "./helpers.js";

const logList = document.getElementById("logList")

const schema = `<a class="border-bottom-0 notification rounded-0 border-x-0 border-300">
    <div class="notification-body">
        <span class="notification-time">{}</span>
        <p class="mb-1">
            <b>{}: {}/</b> </br>
            {}
        </p>
        <span class="notification-time">{}</span>
    </div>
</a>`


async function loadLogs() {
    const users = await readData('users')
    const logs = await readData('logs')
    logList.innerHTML = ''

    for (let logId in logs) {
        const log = logs[logId]
        const row = schema.format(
            users[log.userId]?.name || 'Anonymous',
            log.action, log.target, JSON.stringify(log.changeData || {}),
            new Date(log.timestamp)
        )

        logList.innerHTML += row
    }
}

window.onload  = loadLogs
