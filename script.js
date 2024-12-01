document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const taskTime = document.getElementById('task-time');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const langToggle = document.getElementById('lang-toggle');
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Translations
    const translations = {
        en: {
            'title': 'Todo List',
            'add-task': 'Add your task...',
            'all': 'All',
            'active': 'Active',
            'completed': 'Completed',
            'clear-completed': 'Clear Completed',
            'tasks-left': (n) => `${n} task${n !== 1 ? 's' : ''} left`,
            'progress': 'Progress',
            'time-left': (time) => `${time} left`,
            'overdue': 'Overdue',
            'due-soon': 'Due soon',
            'completed': 'Completed',
        },
        ar: {
            'title': 'قائمة المهام',
            'add-task': 'أضف مهمة جديدة...',
            'all': 'الكل',
            'active': 'النشطة',
            'completed': 'المكتملة',
            'clear-completed': 'مسح المكتملة',
            'tasks-left': (n) => `${n} ${n === 1 ? 'مهمة متبقية' : 'مهام متبقية'}`,
            'progress': 'التقدم',
            'time-left': (time) => `متبقي ${time}`,
            'overdue': 'متأخر',
            'due-soon': 'قريباً',
            'completed': 'مكتملة',
        }
    };

    // Language handling
    let currentLang = localStorage.getItem('lang') || 'en';
    
    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('lang', lang);
        langToggle.querySelector('span').textContent = lang.toUpperCase();
        updateTranslations();
    }

    function updateTranslations() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key === 'tasks-left') {
                const activeTasks = tasks.filter(task => !task.completed).length;
                element.textContent = translations[currentLang][key](activeTasks);
            } else if (key === 'progress') {
                element.textContent = translations[currentLang][key];
            } else {
                element.textContent = translations[currentLang][key];
            }
        });

        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = translations[currentLang][key];
        });
    }

    if (currentLang) {
        setLanguage(currentLang);
    }

    langToggle.addEventListener('click', () => {
        setLanguage(currentLang === 'en' ? 'ar' : 'en');
    });

    // Theme handling
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    if (currentTheme) {
        setTheme(currentTheme);
    } else {
        setTheme(prefersDarkScheme.matches ? 'dark' : 'light');
    }

    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        setTheme(theme === 'light' ? 'dark' : 'light');
    });

    prefersDarkScheme.addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
    });

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTasksCounter();
        updateProgress();
    }

    function updateTasksCounter() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCounter.textContent = translations[currentLang]['tasks-left'](activeTasks);
    }

    function updateProgress() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        
        // Add animation class
        progressFill.classList.remove('animate');
        void progressFill.offsetWidth; // Trigger reflow
        progressFill.classList.add('animate');

        // Update progress bar color based on percentage
        if (percentage === 100) {
            progressFill.style.background = 'var(--completed-accent)';
        } else {
            progressFill.style.background = 'var(--accent)';
        }
    }

    function formatTimeLeft(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        
        if (diff < 0) return 'overdue';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    function getTimeStatus(dueDate) {
        if (!dueDate) return '';
        
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        
        if (diff < 0) return 'urgent';
        if (diff < 1000 * 60 * 60 * 24) return 'near';
        return '';
    }

    function updateTaskTimes() {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const timeInfo = item.querySelector('.time-info');
            if (timeInfo) {
                const dueDate = timeInfo.dataset.time;
                const isCompleted = item.classList.contains('completed');
                if (dueDate) {
                    const status = getTimeStatus(dueDate, isCompleted);
                    const timeLeft = formatTimeLeft(dueDate);
                    
                    timeInfo.className = `time-info ${status}`;
                    timeInfo.innerHTML = `
                        <i class="fas fa-clock"></i>
                        <span>${isCompleted ? translations[currentLang]['completed'] :
                               status === 'urgent' ? translations[currentLang]['overdue'] :
                               status === 'near' ? translations[currentLang]['due-soon'] :
                               translations[currentLang]['time-left'](timeLeft)}</span>
                    `;
                }
            }
        });
    }

    // Update times every minute
    setInterval(updateTaskTimes, 60000);

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.draggable = true;
        
        const timeHtml = task.dueDate ? `
            <div class="time-info ${getTimeStatus(task.dueDate, task.completed)}" data-time="${task.dueDate}">
                <i class="fas fa-clock"></i>
                <span>${task.completed ? translations[currentLang]['completed'] : formatTimeLeft(task.dueDate)}</span>
            </div>
        ` : '';

        li.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            ${timeHtml}
            <button class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;

        const checkbox = li.querySelector('.checkbox');
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            li.classList.toggle('completed');
            saveTasks();
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            tasks = tasks.filter(t => t !== task);
            li.remove();
            saveTasks();
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
            completed: false,
            dueDate: taskTime.value || null
        };

        tasks.push(newTask);
        const taskElement = createTaskElement(newTask);
        taskList.appendChild(taskElement);
        saveTasks();
        
        // Clear inputs
        taskInput.value = '';
        taskTime.value = '';
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
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value);
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
    updateProgress();
});
