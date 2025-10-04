import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Íconos SVG como Componentes ---
// Usamos componentes de React para los íconos para mantener todo en un solo archivo y facilitar su uso.
const HomeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.516a8.001 8.001 0 008.526 0M12 21a9 9 0 100-18 9 9 0 000 18z" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ListIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const SunIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 16a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
);

const MoonIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const MenuIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const ChatIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const SendIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

// --- Datos Simulados ---
// Estos datos simulan una base de datos de tareas y listas.
const initialTasks = [
    { id: 1, title: 'Diseñar la landing page', description: 'Crear los mockups en Figma', dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), isImportant: true, status: 'Por Hacer', listId: 1, priority: 'Alta', duration: 2 }, // duration in days
    { id: 2, title: 'Reunión de equipo', description: 'Discutir el progreso del sprint', dueDate: new Date(), isImportant: true, status: 'Por Hacer', listId: 1, priority: 'Alta', duration: 0.25 },
    { id: 3, title: 'Desarrollar componente de Auth', description: 'Implementar login y registro', dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), isImportant: false, status: 'En Progreso', listId: 1, priority: 'Media', duration: 3 },
    { id: 4, title: 'Comprar víveres', description: 'Leche, pan, huevos', dueDate: new Date(), isImportant: false, status: 'Hecho', listId: 2, priority: 'Baja', duration: 0.1 },
    { id: 5, title: 'Planear viaje de vacaciones', description: 'Investigar destinos y vuelos', dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), isImportant: false, status: 'Por Hacer', listId: 2, priority: 'Media', duration: 5 },
];

const initialLists = [
    { id: 1, name: 'Proyecto Titán', priority: 'Alta' },
    { id: 2, name: 'Personal', priority: 'Media' }
];

const KANBAN_COLUMNS = ['Por Hacer', 'En Progreso', 'Hecho'];


// --- Componente TaskCard ---
const TaskCard = ({ task, onDragStart, listMap }) => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && task.status !== 'Hecho';
    const isToday = dueDate.toDateString() === today.toDateString();

    const dateColor = isOverdue ? 'text-red-400' : isToday ? 'text-blue-400' : 'dark:text-gray-400 text-gray-500';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-lg p-4 mb-4 cursor-grab active:cursor-grabbing transition-all duration-300 hover:shadow-xl hover:scale-105"
        >
            <h4 className="font-bold dark:text-gray-100 text-gray-800">{task.title}</h4>
            <p className="text-sm dark:text-gray-300 text-gray-600 my-2">{task.description}</p>
            <div className="flex justify-between items-center mt-3 text-xs">
                <span className={dateColor}>
                    {dueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center space-x-2">
                    {task.isImportant && <StarIcon className="w-4 h-4 text-yellow-500" />}
                    {listMap[task.listId] && (
                         <span className="bg-sky-200 text-sky-800 dark:bg-sky-800 dark:text-sky-200 px-2 py-1 rounded-full">{listMap[task.listId]}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Componente KanbanBoard ---
const KanbanBoard = ({ tasks, setTasks, lists }) => {
    const listMap = useMemo(() => lists.reduce((acc, list) => {
        acc[list.id] = list.name;
        return acc;
    }, {}), [lists]);

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, newStatus) => {
        const taskId = e.dataTransfer.getData("taskId");
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === parseInt(taskId) ? { ...task, status: newStatus } : task
            )
        );
    };

    const tasksByStatus = useMemo(() => {
        return KANBAN_COLUMNS.reduce((acc, status) => {
            acc[status] = tasks.filter(task => task.status === status);
            return acc;
        }, {});
    }, [tasks]);

    return (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 p-4">
            {KANBAN_COLUMNS.map(status => (
                <div
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="bg-white/10 dark:bg-gray-900/40 rounded-xl p-4 w-full md:w-1/3 min-h-[50vh] transition-colors duration-300"
                >
                    <h3 className="font-bold text-lg mb-4 text-center dark:text-gray-200 text-gray-700 border-b-2 border-gray-500/20 pb-2">{status}</h3>
                    <div className="space-y-4">
                        {tasksByStatus[status].map(task => (
                            <TaskCard key={task.id} task={task} onDragStart={handleDragStart} listMap={listMap}/>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Componente de creación de tareas ---
const CreateTaskView = ({ onAddTask, lists }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [listId, setListId] = useState(lists[0]?.id || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !dueDate || !listId) {
            alert("Por favor, rellena el título, la fecha y la lista.");
            return;
        }
        onAddTask({
            id: Date.now(),
            title,
            description,
            dueDate: new Date(dueDate),
            isImportant,
            status: 'Por Hacer',
            listId: parseInt(listId)
        });
        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
        setIsImportant(false);
    };
    
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 dark:text-white text-gray-800">Crear Nueva Tarea</h2>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-xl p-8">
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Título</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Descripción</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"></textarea>
                </div>
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Fecha de Vencimiento</label>
                    <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                </div>
                <div>
                    <label htmlFor="listId" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Lista</label>
                    <select id="listId" value={listId} onChange={e => setListId(e.target.value)} className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2">
                         {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center">
                    <input type="checkbox" id="isImportant" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="isImportant" className="ml-2 block text-sm dark:text-gray-300 text-gray-700">Marcar como importante</label>
                </div>
                 <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300">
                    Añadir Tarea
                </button>
            </form>
        </div>
    );
};

// --- Componente Gantt/Timeline ---
const TimelineDiagram = ({ tasks }) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 2);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);
    
    const priorityColors = {
        'Alta': 'bg-red-500',
        'Media': 'bg-yellow-500',
        'Baja': 'bg-green-500',
    };

    const taskPositions = useMemo(() => {
        const positions = [];
        const lanes = []; // Keep track of vertical placement to avoid overlap text

        const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        sortedTasks.forEach(task => {
            const taskStart = new Date(task.dueDate);
            const duration = task.duration || 1;
            const taskEnd = new Date(taskStart);
            taskEnd.setDate(taskStart.getDate() + duration);
            
            if (taskStart > endDate || taskEnd < startDate) return;

            const totalTimelineMillis = endDate.getTime() - startDate.getTime();
            const left = ((taskStart.getTime() - startDate.getTime()) / totalTimelineMillis) * 100;
            const width = (duration * (1000 * 3600 * 24) / totalTimelineMillis) * 100;

            let lane = 0;
            while (lanes[lane] && taskStart < lanes[lane]) {
                lane++;
            }
            lanes[lane] = taskEnd;
            
            positions.push({ ...task, left: Math.max(0, left), width: Math.min(100 - left, width), top: lane * 4 + 4 }); // top in rem, increased spacing for tooltips
        });
        return positions;
    }, [tasks, startDate, endDate]);
    
    const dayMarkers = [];
    const loopDate = new Date(startDate);
    while(loopDate <= endDate) {
        dayMarkers.push(new Date(loopDate));
        loopDate.setDate(loopDate.getDate() + 1);
    }

    return (
        <div className="p-4 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl mt-8">
            <h3 className="text-xl font-bold mb-4 dark:text-white text-gray-800">Diagrama Temporal</h3>
            <div className="overflow-x-auto relative pb-4">
                <div className="relative h-96 pt-12" style={{ width: '1500px' }}> {/* Increased top padding */}
                    {/* Day Markers */}
                    {dayMarkers.map((markerDate, i) => {
                        const leftPosition = ((markerDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
                        return (
                            <div key={i} style={{ left: `${leftPosition}%` }} className="absolute top-0 h-full flex justify-center pointer-events-none">
                                <span className="absolute top-0 text-xs dark:text-gray-400 text-gray-500 whitespace-nowrap">
                                    {markerDate.toLocaleDateString('es-ES', {day: 'numeric', month:'short'})}
                                </span>
                                <div className="absolute top-6 bottom-0 w-px bg-gray-400/30"></div>
                            </div>
                        );
                    })}
                    
                    {/* Today Marker */}
                    <div style={{ left: `${((new Date().getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100}%` }} className="absolute top-0 h-full z-10 flex justify-center pointer-events-none">
                        <span className="absolute top-0 text-xs text-indigo-500 font-bold whitespace-nowrap">Hoy</span>
                        <div className="absolute top-6 bottom-0 w-0.5 bg-indigo-500"></div>
                    </div>
                    
                    {/* Task Bars */}
                    {taskPositions.map(task => (
                        <div
                            key={task.id}
                            className="absolute h-8 rounded-md flex items-center group"
                            style={{ left: `${task.left}%`, width: `${task.width}%`, top: `${task.top}rem` }}
                        >
                            <div className={`w-full h-full rounded-md ${priorityColors[task.priority] || 'bg-gray-500'} transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl cursor-pointer`}>
                            </div>
                             <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-lg shadow-2xl p-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                               <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                   <p><strong className="text-gray-800 dark:text-white">Descripción:</strong> {task.description || 'N/A'}</p>
                                   <p><strong className="text-gray-800 dark:text-white">Duración:</strong> {task.duration} día(s)</p>
                               </div>
                               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/60 dark:bg-gray-900/60 transform rotate-45" style={{backdropFilter: 'blur(10px)'}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Componente de creación de listas ---
const CreateListView = ({ onAddList, onAddTask, allTasks }) => {
    const [listName, setListName] = useState('');
    const [listPriority, setListPriority] = useState('Media');
    const [tasksInList, setTasksInList] = useState([]);
    
    // State for the new task form within the list
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Media');
    const [newTaskDuration, setNewTaskDuration] = useState(1);
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    const handleAddTaskToList = (taskId) => {
        const taskToAdd = allTasks.find(t => t.id === parseInt(taskId));
        if (taskToAdd && !tasksInList.find(t => t.id === taskToAdd.id)) {
            setTasksInList(prev => [...prev, taskToAdd]);
        }
    };
    
    const handleCreateAndAddTask = (e) => {
        e.preventDefault();
        const newTask = {
            id: Date.now(),
            title: newTaskTitle,
            description: '',
            dueDate: new Date(newTaskDueDate),
            isImportant: newTaskPriority === 'Alta',
            status: 'Por Hacer',
            listId: null, // Will be assigned on list creation
            priority: newTaskPriority,
            duration: parseFloat(newTaskDuration)
        };
        onAddTask(newTask); // Add to global tasks state
        setTasksInList(prev => [...prev, newTask]); // Add to current list's tasks
        // Reset form
        setNewTaskTitle('');
        setNewTaskPriority('Media');
        setNewTaskDuration(1);
        setNewTaskDueDate('');
        setShowNewTaskForm(false);
    };

    const handleSaveList = () => {
        if (!listName) {
            alert("Por favor, dale un nombre a la lista.");
            return;
        }
        const newList = {
            id: Date.now(),
            name: listName,
            priority: listPriority,
        };
        onAddList(newList, tasksInList);
        // Reset state
        setListName('');
        setListPriority('Media');
        setTasksInList([]);
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 dark:text-white text-gray-800">Crear Nueva Lista</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="space-y-6 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-xl p-8">
                    <div>
                        <label htmlFor="listName" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Nombre de la Lista</label>
                        <input type="text" id="listName" value={listName} onChange={e => setListName(e.target.value)} className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="listPriority" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Prioridad de la Lista</label>
                        <select id="listPriority" value={listPriority} onChange={e => setListPriority(e.target.value)} className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2">
                            <option>Baja</option>
                            <option>Media</option>
                            <option>Alta</option>
                        </select>
                    </div>

                    <hr className="my-4 border-gray-200 dark:border-gray-700/50" />
                    
                    {/* Add existing task */}
                    <div>
                        <label htmlFor="existingTask" className="block text-sm font-medium dark:text-gray-300 text-gray-700">Añadir tarea existente</label>
                         <select id="existingTask" onChange={e => handleAddTaskToList(e.target.value)} className="mt-1 block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2">
                             <option>Selecciona una tarea...</option>
                            {allTasks.filter(t => !tasksInList.some(til => til.id === t.id)).map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                        </select>
                    </div>

                    {/* Create new task */}
                    <button onClick={() => setShowNewTaskForm(!showNewTaskForm)} className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                        O crear una nueva tarea para esta lista
                    </button>
                    
                    {showNewTaskForm && (
                        <form onSubmit={handleCreateAndAddTask} className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                            <input type="text" placeholder="Título de la nueva tarea" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required className="block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md p-2" />
                             <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} required className="block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md p-2" />
                            <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} className="block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md p-2">
                                <option>Baja</option>
                                <option>Media</option>
                                <option>Alta</option>
                            </select>
                            <input type="number" placeholder="Duración (días)" value={newTaskDuration} onChange={e => setNewTaskDuration(e.target.value)} min="0.1" step="0.1" required className="block w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md p-2" />
                            <button type="submit" className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600">Añadir Tarea a la Lista</button>
                        </form>
                    )}

                    <button onClick={handleSaveList} className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300">
                        Guardar Lista
                    </button>
                </div>

                {/* Diagram Section */}
                <div className="lg:col-span-1">
                    <TimelineDiagram tasks={tasksInList} />
                </div>
            </div>
        </div>
    );
};


// --- Componente para ver listas existentes ---
const ViewLists = ({ lists, tasks }) => {
    const [selectedList, setSelectedList] = useState(null);

    const tasksByListId = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (task.listId) {
                if (!acc[task.listId]) {
                    acc[task.listId] = [];
                }
                acc[task.listId].push(task);
            }
            return acc;
        }, {});
    }, [tasks]);

    if (selectedList) {
        const tasksForSelectedList = tasksByListId[selectedList.id] || [];
        return (
            <div className="p-8">
                <button onClick={() => setSelectedList(null)} className="mb-6 bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2">
                    <span>&larr;</span>
                    <span>Volver a las listas</span>
                </button>
                <h2 className="text-3xl font-bold mb-2 dark:text-white text-gray-800">{selectedList.name}</h2>
                <p className="text-lg dark:text-gray-400 text-gray-600 mb-6">Prioridad: {selectedList.priority}</p>
                
                <TimelineDiagram tasks={tasksForSelectedList} />

                <h3 className="text-2xl font-bold mt-8 mb-4 dark:text-white text-gray-800">Tareas en esta lista</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasksForSelectedList.length > 0 ? (
                        tasksForSelectedList.map(task => (
                           <div key={task.id} className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-lg p-4">
                                <h4 className="font-bold dark:text-gray-100 text-gray-800">{task.title}</h4>
                                <p className="text-sm dark:text-gray-300 text-gray-600 my-1">{task.description}</p>
                                <p className="text-xs dark:text-gray-400 text-gray-500 mt-2">Vence: {new Date(task.dueDate).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="dark:text-gray-400 text-gray-600 col-span-full">No hay tareas asignadas a esta lista.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 dark:text-white text-gray-800">Mis Listas</h2>
            {lists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lists.map(list => (
                        <div
                            key={list.id}
                            onClick={() => setSelectedList(list)}
                            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-xl p-6 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                            <h3 className="text-xl font-bold dark:text-white text-gray-800">{list.name}</h3>
                            <p className="dark:text-gray-400 text-gray-600">Prioridad: {list.priority}</p>
                            <div className="mt-4 pt-4 border-t border-gray-500/20 flex justify-between items-center">
                                <span className="dark:text-gray-400 text-gray-600 text-sm">
                                    {tasksByListId[list.id]?.length || 0} Tareas
                                </span>
                                <span className="text-xs text-indigo-500 font-semibold">VER DETALLES &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="dark:text-gray-400 text-gray-600">Aún no has creado ninguna lista. ¡Ve a "Crear Lista" para empezar!</p>
            )}
        </div>
    );
};


// --- Componente Chatbox ---
const Chatbox = ({ tasks }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: '¡Hola! Soy tu asistente de tareas. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [userInput, setUserInput] = useState('');

    useEffect(() => {
        const checkTasks = () => {
            const now = new Date();
            const upcomingTasks = tasks.filter(task => {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate.getTime() - now.getTime();
                const dayDiff = timeDiff / (1000 * 3600 * 24);
                return dayDiff > 0 && dayDiff <= 1 && task.status !== 'Hecho';
            });

            if (upcomingTasks.length > 0) {
                const task = upcomingTasks[0];
                 const message = `Recuerda, la tarea "${task.title}" vence mañana. ¡Tú puedes! Un pequeño paso hoy hace una gran diferencia.`;
                 if (!messages.some(m => m.text === message)) {
                    setMessages(prev => [...prev, { from: 'bot', text: message }]);
                 }
            }
        };

        const intervalId = setInterval(checkTasks, 60000); // Comprobar cada minuto
        return () => clearInterval(intervalId);
    }, [tasks, messages]);
    
    const handleSend = () => {
        if(!userInput.trim()) return;

        const newMessages = [...messages, { from: 'user', text: userInput }];
        
        let botResponse = "No he entendido bien. Prueba a preguntar por 'tareas para hoy' o 'tareas importantes'.";
        if (userInput.toLowerCase().includes('hola')) {
            botResponse = "¡Hola de nuevo! ¿Listo para ser productivo?";
        } else if (userInput.toLowerCase().includes('importante')) {
            const importantTasks = tasks.filter(t => t.isImportant && t.status !== 'Hecho');
            if(importantTasks.length > 0) {
                botResponse = `Tienes ${importantTasks.length} tareas importantes: ${importantTasks.map(t => t.title).join(', ')}.`;
            } else {
                botResponse = "No tienes tareas importantes pendientes. ¡Buen trabajo!";
            }
        } else if (userInput.toLowerCase().includes('hoy')) {
             const todayTasks = tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== 'Hecho');
             if(todayTasks.length > 0) {
                botResponse = `Para hoy tienes: ${todayTasks.map(t => t.title).join(', ')}. ¡Vamos a por ellas!`;
            } else {
                botResponse = "Parece que no tienes nada para hoy. ¿Quizás quieras añadir una nueva tarea?";
            }
        }

        newMessages.push({ from: 'bot', text: botResponse });

        setMessages(newMessages);
        setUserInput('');
    };


    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform duration-300 hover:scale-110 z-50"
            >
                <ChatIcon className="w-8 h-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 w-80 h-96 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col z-50 border border-white/30 dark:border-gray-700/30">
            <div className="flex justify-between items-center p-3 border-b border-gray-300/50 dark:border-gray-700/50">
                <h3 className="font-bold text-gray-800 dark:text-white">Tu Aliado</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">&times;</button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.from === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                           {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-gray-300/50 dark:border-gray-700/50 flex">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent border border-gray-400 dark:border-gray-600 rounded-l-full py-2 px-4 focus:outline-none dark:text-white"
                />
                <button onClick={handleSend} className="bg-indigo-500 text-white px-4 py-2 rounded-r-full hover:bg-indigo-600">
                    <SendIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};


// --- Componente Principal del Dashboard ---
const Dashboard = ({ user, onLogout, darkMode, toggleDarkMode }) => {
    const [activeSection, setActiveSection] = useState('Hoy');
    const [tasks, setTasks] = useState(initialTasks);
    const [lists, setLists] = useState(initialLists);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const listMap = useMemo(() => lists.reduce((acc, list) => {
        acc[list.id] = list.name;
        return acc;
    }, {}), [lists]);

    const handleAddTask = (newTask) => {
        setTasks(prev => [...prev, newTask]);
    };
    
    const handleAddList = (newList, tasksForList) => {
        setLists(prev => [...prev, newList]);
        // Update tasks with the new listId
        const taskIdsToUpdate = tasksForList.map(t => t.id);
        setTasks(prevTasks => prevTasks.map(task => 
            taskIdsToUpdate.includes(task.id) ? { ...task, listId: newList.id } : task
        ));
        alert(`Lista "${newList.name}" creada con éxito!`);
        setActiveSection('Mis Listas');
    };


    const renderSection = () => {
        let filteredTasks;
        let title;
        switch (activeSection) {
            case 'Hoy':
                title = "Qué tengo para hoy";
                filteredTasks = tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString());
                break;
            case 'Importantes':
                 title = "Tareas Importantes";
                filteredTasks = tasks.filter(t => t.isImportant);
                break;
            case 'Planeado':
                title = "Qué tengo planeado";
                filteredTasks = tasks.filter(t => new Date(t.dueDate) > new Date());
                break;
            case 'Vista Global':
                return (
                     <div>
                        <h2 className="text-3xl font-bold mb-6 dark:text-white text-gray-800 px-4 md:px-8">Vista Global de Tareas</h2>
                        <KanbanBoard tasks={tasks} setTasks={setTasks} lists={lists} />
                    </div>
                );
             case 'Crear Tarea':
                return <CreateTaskView onAddTask={handleAddTask} lists={lists} />;
             case 'Crear Lista':
                return <CreateListView onAddList={handleAddList} onAddTask={handleAddTask} allTasks={tasks} />;
            case 'Mis Listas':
                return <ViewLists lists={lists} tasks={tasks} />;
            default:
                title = "Qué tengo para hoy";
                filteredTasks = [];
        }
        
        return (
            <div className="p-4 md:p-8">
                <h2 className="text-3xl font-bold mb-6 dark:text-white text-gray-800">{title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => <TaskCard key={task.id} task={task} onDragStart={()=>{}} listMap={listMap}/>)
                    ) : (
                        <p className="dark:text-gray-400 text-gray-600">No hay tareas en esta sección.</p>
                    )}
                </div>
            </div>
        );
    };

    const SidebarLink = ({ icon, text, sectionName }) => {
        const isActive = activeSection === sectionName;
        return (
            <button
                onClick={() => {
                    setActiveSection(sectionName);
                    if (isSidebarOpen) setSidebarOpen(false);
                }}
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                {icon}
                <span className="ml-4 font-medium">{text}</span>
            </button>
        );
    };

    const sidebarContent = (
         <div className="p-4 space-y-2">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 px-2">Anclora Kairon</h1>
            <SidebarLink icon={<HomeIcon className="w-6 h-6" />} text="Qué tengo para hoy" sectionName="Hoy" />
            <SidebarLink icon={<StarIcon className="w-6 h-6" />} text="Tareas importantes" sectionName="Importantes" />
            <SidebarLink icon={<CalendarIcon className="w-6 h-6" />} text="Qué tengo planeado" sectionName="Planeado" />
            <SidebarLink icon={<GlobeIcon className="w-6 h-6" />} text="Vista Global" sectionName="Vista Global" />
            <SidebarLink icon={<ListIcon className="w-6 h-6" />} text="Mis Listas" sectionName="Mis Listas" />
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <SidebarLink icon={<PlusIcon className="w-6 h-6" />} text="Crear Tarea" sectionName="Crear Tarea" />
            <SidebarLink icon={<ListIcon className="w-6 h-6" />} text="Crear Lista" sectionName="Crear Lista" />
        </div>
    );

    return (
        <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
            {/* Sidebar para pantallas grandes */}
            <aside className="hidden lg:block w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 flex-shrink-0">
                {sidebarContent}
            </aside>

             {/* Sidebar para móviles */}
            <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
            <aside className={`fixed top-0 left-0 h-full w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 z-50 transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 {sidebarContent}
            </aside>

            <main className="flex-1 flex flex-col bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-gray-900 dark:to-slate-800 overflow-y-auto">
                {/* Top Navbar */}
                 <header className="flex-shrink-0 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-b border-white/30 dark:border-gray-700/30 p-4 flex justify-between items-center">
                    <button className="lg:hidden text-gray-700 dark:text-gray-200" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <MenuIcon className="w-6 h-6"/>
                    </button>
                    <div className="flex-1"></div> {/* Espaciador */}
                    <div className="flex items-center space-x-4">
                        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-500/20 transition-colors">
                           {darkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-700" />}
                        </button>
                        <div className="relative group">
                            <button className="flex items-center space-x-2">
                                <img src={`https://i.pravatar.cc/150?u=${user.email}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-400" />
                                <span className="hidden md:block font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-md shadow-lg py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-500 hover:text-white">Perfil</a>
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-500 hover:text-white">Configuración</a>
                                <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-500 hover:text-white">Cerrar Sesión</button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Contenido Principal */}
                <div className="flex-1 overflow-y-auto">
                    {renderSection()}
                </div>
                 <Chatbox tasks={tasks} />
            </main>
        </div>
    );
};


// --- Componente de Autenticación ---
const AuthScreen = ({ onLogin, onRegister }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            onLogin({ email, password });
        } else {
            onRegister({ email, password });
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 space-y-8">
                <div>
                    <h2 className="text-center text-4xl font-extrabold text-white">
                        {isLogin ? 'Inicia Sesión' : 'Crea tu Cuenta'}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                     <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-white/20 placeholder-gray-400 bg-transparent text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Correo electrónico"
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-white/20 placeholder-gray-400 bg-transparent text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                        >
                           {isLogin ? 'Entrar' : 'Registrarse'}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-medium text-indigo-200 hover:text-white transition-colors"
                    >
                        {isLogin ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia Sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componente Raíz de la Aplicación ---
export default function App() {
    // Usamos un objeto para el usuario para simular una sesión real
    const [user, setUser] = useState(null); 
    const [darkMode, setDarkMode] = useState(false);

    const handleLogin = (credentials) => {
        // Simulación de login: cualquier email/pass funciona
        console.log('Login attempt:', credentials);
        setUser({ email: credentials.email });
    };

    const handleRegister = (credentials) => {
        // Simulación de registro
        console.log('Register attempt:', credentials);
        setUser({ email: credentials.email });
    };
    
    const handleLogout = () => {
        setUser(null);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Aplicar la clase 'dark' al elemento <html> para que Tailwind la detecte
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    if (!user) {
        return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
    }

    return <Dashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}