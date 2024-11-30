document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateTasksCounter() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCounter.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;

        const checkbox = li.querySelector('.checkbox');
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            li.classList.toggle('completed');
            saveTasks();
            updateTasksCounter();
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            tasks = tasks.filter(t => t !== task);
            li.remove();
            saveTasks();
            updateTasksCounter();
        });

        // Add drag and drop event listeners
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);

        return li;
    }

    // Drag and Drop functionality
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => item.classList.remove('drag-over'));
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();

        if (draggedItem !== this) {
            // Reorder tasks array
            const allItems = [...taskList.querySelectorAll('.task-item')];
            const draggedIndex = allItems.indexOf(draggedItem);
            const droppedIndex = allItems.indexOf(this);

            if (draggedIndex !== -1 && droppedIndex !== -1) {
                // Reorder in DOM
                if (droppedIndex < draggedIndex) {
                    this.parentNode.insertBefore(draggedItem, this);
                } else {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                }

                // Reorder in tasks array
                const [movedTask] = tasks.splice(draggedIndex, 1);
                tasks.splice(droppedIndex, 0, movedTask);
                saveTasks();
            }
        }

        this.classList.remove('drag-over');
        return false;
    }

    function addTask(text) {
        if (text.trim() === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        tasks.push(newTask);
        const taskElement = createTaskElement(newTask);
        taskList.appendChild(taskElement);
        saveTasks();
        updateTasksCounter();
    }

    function filterTasks(filterType) {
        const taskItems = taskList.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            switch (filterType) {
                case 'all':
                    item.style.display = 'flex';
                    break;
                case 'active':
                    item.style.display = item.classList.contains('completed') ? 'none' : 'flex';
                    break;
                case 'completed':
                    item.style.display = item.classList.contains('completed') ? 'flex' : 'none';
                    break;
            }
        });
    }

    // Event Listeners
    addButton.addEventListener('click', () => {
        addTask(taskInput.value);
        taskInput.value = '';
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value);
            taskInput.value = '';
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTasksCounter();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTasks(btn.dataset.filter);
        });
    });

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    // Initial render
    renderTasks();
    updateTasksCounter();
});
