import { fetchPaginatedData, readData } from "./helpers.js";

let users = [];
let startAtKey = null, endAtKey = null, page = 1;
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

async function loadLogs(logs) {
  logList.innerHTML = ''

  for (let logId in logs) {
    const log = logs[logId]
    const row = schema.format(
      users[log.userId]?.name || 'Anonymous',
      log.action, log.target, JSON.stringify(log.changeData || {}),
      new Date(log.timestamp)
    )
    logList.innerHTML = row + logList.innerHTML
  }
}

async function loadNextPage(direction, pageSize = 50) {
  console.log(startAtKey, endAtKey)
  try {
    if (direction == 'next') {
      const { data, startKey, endKey } = await fetchPaginatedData('logs', pageSize, '', startAtKey);
      startAtKey = startKey; endAtKey = endKey; page += 1;
      loadLogs(data);
    } else if (direction == 'prev') {
      if (page == 1) return []
      const { data, startKey, endKey } = await fetchPaginatedData('logs', pageSize, endAtKey, '');
      startAtKey = startKey; endAtKey = endKey; page -= 1;
      loadLogs(data);
    } else {
      const { data, startKey, endKey } = await fetchPaginatedData('logs', pageSize-1);
      startAtKey = startKey; endAtKey = endKey; page = 1;
      loadLogs(data);
    }
  } catch (error) {
    console.error('Error fetching paginated data:', error);
  }
}
window.loadNextPage = loadNextPage


window.onload = async () => { 
  users = await readData('users')
  loadNextPage();
}
