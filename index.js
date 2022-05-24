const state = {
    backlog: [],
    users: [],

}


async function getUsers() {
    const res = await fetch('https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users?limit=15')
    const res1 = await fetch('https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks')
    const tasks = await res1.json()
    const users = await res.json()

    const activeTasks = []
    const backlog = []
    tasks.forEach(item => {
        if (item.executor) {
            activeTasks.push(item)
        } else {
            backlog.push(item)
        }
    })


    state.users = users.map(user => {
        const tasks = {}
        activeTasks.filter(item => item.executor === user.id)
        return { ...user, tasks: activeTasks.filter(item => item.executor === user.id) }
    })
    state.backlog = backlog

    updateTable()
}
getUsers()


function updateTable() {
    console.log(state)
    const table = document.querySelector('#sheduler-table')

    
    const tableTemplate = state.users.map(item => {

        const cells = Array(10).fill().map((_, day) => `<div class="table-cell">${day + 1}</div>`).join('')

        return `<div class="table-row">${cells}</div>`
    }).join('')
    table.innerHTML = tableTemplate
}

