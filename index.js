const state = {
  backlog: [],
  users: [],
  currentFirstDate: null
}
const THS = document.querySelector('#thead-row').children;
const BACKLOG = document.querySelector('#backlog__container')
const SCHEDULER_TABLE_BODY = document.querySelector('#scheduler-table_tbody')

const NUMBER_DAYS_OF_WEEK = 7

document.querySelector('#prev-week').onclick = function () {
  setDate(addDate(state.currentFirstDate, -NUMBER_DAYS_OF_WEEK));
  updateCells()
};
document.querySelector('#next-week').onclick = function () {
  setDate(addDate(state.currentFirstDate, NUMBER_DAYS_OF_WEEK));
  updateCells()
};

BACKLOG.addEventListener('dragstart', e => {
  e.target.classList.add('selected');
})

BACKLOG.addEventListener('dragend', e => {
  e.target.classList.remove('selected');
})


SCHEDULER_TABLE_BODY.addEventListener('dragover', e => {
  e.preventDefault();
});

SCHEDULER_TABLE_BODY.addEventListener('drop', e => {
  e.preventDefault();

  const draggableTask = BACKLOG.querySelector('.selected')
  const task = state.backlog.find(item => item.id === draggableTask.getAttribute('id'))
  const currentElement = e.target.closest('td')
  const typeElement = currentElement.getAttribute('type')

  const isTableCell = typeElement === 'task' || typeElement === 'username'
  if (!isTableCell) return

  const userIndex = state.users.findIndex(item => item.id === parseInt(currentElement.getAttribute('userId')))
  const currentDate = typeElement === 'task' ? currentElement.getAttribute('date') : task.planStartDate
  const activeDate = state.users[userIndex].tasks[currentDate]
  if (activeDate) {
    if (activeDate.length === 3) {
      alert('Достигнуто максимальное колличество тасков')
      return
    }
    state.users[userIndex].tasks[currentDate].push(task)
  } else {
    state.users[userIndex].tasks[currentDate] = [task]
  }

  state.backlog = state.backlog.filter(item => item.id !== draggableTask.getAttribute('id'))
  updateCells()
  updateBacklog()
})

function addDate(date, n) {
  date.setDate(date.getDate() + n);
  return date;
};

function setDate(date) {
  const week = date.getDay() - 1;
  date = addDate(date, week * -1);
  state.currentFirstDate = new Date(date);

  Array.from(THS).forEach((th, i) => {
    if (i === 0) return

    const curDate = i === 1 ? date : addDate(date, 1)
    const month = parseNumber(curDate.getMonth() + 1)
    const day = parseNumber(curDate.getDate())
    const year = date.getFullYear()
    th.innerHTML = `${day}.${month}`
    th.setAttribute('date', `${year}-${month}-${day}`);
  })
};

function parseNumber(number) {
  return number < 10 ? `0${number}` : number
};

async function getData() {
  try {
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
      const userTasks = activeTasks.filter(item => item.executor === user.id)
      const tasks = {}
      userTasks.forEach(item => {
        if (tasks[item.planStartDate]) {
          tasks[item.planStartDate].push(item)
        } else {
          tasks[item.planStartDate] = [item]
        }
      })

      return { ...user, tasks }
    })
    state.backlog = backlog
    setDate(new Date())
    updateCells()
    updateBacklog()
    document.querySelector('#wrapper').classList.remove('hidden')
  } catch (err) {
    console.log(err)
    alert('Ошибка сервера, перезагрузите страницу')
  } finally {
    document.querySelector('#spinner__content').classList.add('hidden')
  }
};

function updateCells() {
  SCHEDULER_TABLE_BODY.innerHTML = ''

  state.users.forEach(user => {
    const row = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('type', 'username')
    td.setAttribute('userId', user.id)
    td.setAttribute('class', 'cell-username')
    td.innerHTML = user.username
    row.append(td)

    Array.from(THS).forEach((th, i) => {
      if (i === 0) return
      const userTasks = user.tasks[th.getAttribute('date')]
      const cell = document.createElement('td');
      cell.setAttribute('date', th.getAttribute('date'))
      cell.setAttribute('userId', user.id)
      cell.setAttribute('type', 'task')
      cell.setAttribute('class', 'cell-task')
      if (userTasks) {
        cell.setAttribute('class', 'cell-task_active')
        cell.innerHTML = `<div class="task-container">
        ${userTasks.map((item, i) => {
          return `<div class="task"><span class="tooltip" data-tooltip="${item.subject}">Задача ${i + 1}</span></div>`
        }).join('')}</div>`
      }
      row.append(cell)
    })
    SCHEDULER_TABLE_BODY.append(row)
  })
};

function updateBacklog() {
  BACKLOG.innerHTML = ''
  state.backlog.forEach(item => {
    const task = document.createElement('div')
    const taskWrapper = document.createElement('div')
    task.setAttribute('class', 'backlog__item')
    task.setAttribute('draggable', 'true')
    task.setAttribute('id', item.id)
    taskWrapper.setAttribute('class', 'backlog__item_wrapper')
    task.innerHTML = `${item.subject}  ${item.planStartDate}`
    taskWrapper.append(task)
    BACKLOG.append(taskWrapper)
  })
};


getData()

