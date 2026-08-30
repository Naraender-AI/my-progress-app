import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  TrendingUp,
  Weight,
  X,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./index.css";

const WORKOUTS = {
  D1: {
    name: "Push A",
    exercises: [
      "Incline DB Press",
      "Flat M/DB Press",
      "Cable Fly",
      "DB Shoulder Press",
      "Cable Lateral Raise",
      "OH Cable TE",
      "Rope PD",
    ],
  },
  D2: {
    name: "Pull A",
    exercises: [
      "Lat Pulldown",
      "Chest-Supported Row",
      "SA Lat Pulldown",
      "Cable Pullover",
      "Rear Delt Fly",
      "Face Pull",
      "Incline DB Curl",
      "Hammer Curl",
    ],
  },
  D3: {
    name: "Legs A",
    exercises: [
      "Squat",
      "RDL",
      "BSS",
      "Leg Extension",
      "Leg Curl",
      "Standing Calf Raise",
      "Cable Crunch",
    ],
  },
  D4: {
    name: "Push B",
    exercises: [
      "Incline M/Smith Press",
      "M Chest Press",
      "Cable Fly",
      "M Shoulder Press",
      "Cable Lateral Raise",
      "SA Cable TE",
      "Rope PD",
    ],
  },
  D5: {
    name: "Pull B",
    exercises: [
      "Lat Pulldown",
      "Chest-Supported Row",
      "SA Cable Row",
      "Straight-Arm PD",
      "Rear Delt Fly",
      "Preacher Curl",
      "Incline DB Curl",
      "Hammer Curl",
    ],
  },
  D6: {
    name: "Legs B",
    exercises: [
      "Hip Thrust",
      "Leg Press",
      "RDL",
      "Leg Extension",
      "Seated Leg Curl",
      "Seated Calf Raise",
      "HKR",
    ],
  },
  D7: {
    name: "Cardio & Mobility",
    exercises: ["Cardio", "Mobility"],
  },
};

const DEFAULT_PRODUCTIVITY = {
  thirukkural: 0,
  book: 0,
  manga: 0,
  leetcode: 0,
  gmail: false,
  linkedin: false,
  custom: {},
};

const DEFAULT_STATE = {
  workouts: [],
  bodyWeights: [],
  productivity: {},
  productivityTasks: [],
  todos: [],
  workoutPlans: WORKOUTS,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function loadState() {
  try {
    const saved = localStorage.getItem("strength-tracker-state");
    return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function App() {
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState("dashboard");
  const [selectedDay, setSelectedDay] = useState("D1");
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showProductivityModal, setShowProductivityModal] = useState(false);
  const [editingProductivityTask, setEditingProductivityTask] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  const customTasks = state.productivityTasks || [];

  useEffect(() => {
    localStorage.setItem("strength-tracker-state", JSON.stringify(state));
  }, [state]);

  const today = todayKey();
  const todayProductivity =
    state.productivity[today] || DEFAULT_PRODUCTIVITY;

  const fixedCompleted = [
    todayProductivity.thirukkural >= 5,
    todayProductivity.book >= 5,
    todayProductivity.manga >= 100,
    todayProductivity.leetcode >= 2,
    todayProductivity.gmail,
    todayProductivity.linkedin,
  ].filter(Boolean).length;

  const completedCustom = customTasks.filter(
    (task) =>
      Number(todayProductivity.custom?.[task.id] || 0) >=
      Number(task.target)
  ).length;

  const totalProductivityTasks = 6 + customTasks.length;
  const productivityScore = fixedCompleted + completedCustom;

  const totalWorkouts = state.workouts.length;
  const totalPRs = useMemo(() => {
    let prs = 0;
    const best = {};

    state.workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          const weight = Number(set.weight) || 0;
          if (weight > (best[exercise.name] || 0)) {
            best[exercise.name] = weight;
            prs++;
          }
        });
      });
    });

    return prs;
  }, [state.workouts]);

  const latestWeight =
    state.bodyWeights.length > 0
      ? state.bodyWeights[state.bodyWeights.length - 1].weight
      : null;

  const todoPending = state.todos.filter((todo) => !todo.completed).length;

  function updateTodayProductivity(field, value) {
    setState((current) => ({
      ...current,
      productivity: {
        ...current.productivity,
        [today]: {
          ...(current.productivity[today] || DEFAULT_PRODUCTIVITY),
          [field]: value,
        },
      },
    }));
  }

  function addProductivityTask(task) {
    const cleanName = task.name.trim();
    const cleanTarget = Number(task.target);

    if (!cleanName || !Number.isFinite(cleanTarget) || cleanTarget <= 0) {
      return;
    }

    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: cleanName,
      target: cleanTarget,
      unit: task.unit?.trim() || "times",
    };

    setState((current) => ({
      ...current,
      productivityTasks: [
        ...(current.productivityTasks || []),
        newTask,
      ],
    }));

    setEditingProductivityTask(null);
    setShowProductivityModal(false);
  }

  function editProductivityTask(task) {
    setEditingProductivityTask(task);
    setShowProductivityModal(true);
  }

  function saveEditedProductivityTask(updatedTask) {
    const cleanName = updatedTask.name.trim();
    const cleanTarget = Number(updatedTask.target);

    if (!cleanName || !Number.isFinite(cleanTarget) || cleanTarget <= 0) {
      return;
    }

    setState((current) => ({
      ...current,
      productivityTasks: (current.productivityTasks || []).map((task) =>
        task.id === updatedTask.id
          ? {
              ...task,
              name: cleanName,
              target: cleanTarget,
              unit: updatedTask.unit?.trim() || "times",
            }
          : task
      ),
    }));

    setEditingProductivityTask(null);
    setShowProductivityModal(false);
  }

  function deleteProductivityTask(taskId) {
    setState((current) => {
      const updatedProductivity = { ...current.productivity };

      Object.keys(updatedProductivity).forEach((date) => {
        const day = updatedProductivity[date];

        if (day.custom) {
          const custom = { ...day.custom };
          delete custom[taskId];

          updatedProductivity[date] = {
            ...day,
            custom,
          };
        }
      });

      return {
        ...current,
        productivityTasks: (current.productivityTasks || []).filter(
          (task) => task.id !== taskId
        ),
        productivity: updatedProductivity,
      };
    });
  }

  function updateCustomProductivity(taskId, value) {
    const numericValue = Number(value);

    setState((current) => ({
      ...current,
      productivity: {
        ...current.productivity,
        [today]: {
          ...(current.productivity[today] || DEFAULT_PRODUCTIVITY),
          custom: {
            ...((current.productivity[today] || DEFAULT_PRODUCTIVITY).custom || {}),
            [taskId]: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0,
          },
        },
      },
    }));
  }

  function addWorkout(workout) {
    setState((current) => ({
      ...current,
      workouts: [...current.workouts, workout],
    }));

    setShowWorkoutModal(false);
  }

  function saveWorkoutPlan(day, plan) {
    setState((current) => ({
      ...current,
      workoutPlans: {
        ...current.workoutPlans,
        [day]: plan,
      },
    }));

    setShowPlanModal(false);
  }

  function editWorkout(workout) {
    setEditingWorkout(workout);
  }

  function saveEditedWorkout(updatedWorkout) {
    setState((current) => ({
      ...current,
      workouts: current.workouts.map((workout) =>
        workout.id === updatedWorkout.id
          ? updatedWorkout
          : workout
      ),
    }));

    setEditingWorkout(null);
  }

  function deleteWorkout(workoutId) {
    setState((current) => ({
      ...current,
      workouts: current.workouts.filter(
        (workout) => workout.id !== workoutId
      ),
    }));

    setEditingWorkout(null);
  }

  function addBodyWeight(weight) {
    setState((current) => ({
      ...current,
      bodyWeights: [
        ...current.bodyWeights,
        { date: today, weight: Number(weight) },
      ],
    }));
    setShowWeightModal(false);
  }

  function addTodo(todo) {
    setState((current) => ({
      ...current,
      todos: [
        ...current.todos,
        {
          id: Date.now() + Math.random(),
          text: todo.text,
          priority: todo.priority,
          completed: false,
          date: today,
        },
      ],
    }));
  }

  function toggleTodo(id) {
    setState((current) => ({
      ...current,
      todos: current.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  }

  function deleteTodo(id) {
    setState((current) => ({
      ...current,
      todos: current.todos.filter((todo) => todo.id !== id),
    }));
  }

  function editTodo(todo) {
    setEditingTodo(todo);
  }

  function saveEditedTodo(updatedTodo) {
    setState((current) => ({
      ...current,
      todos: current.todos.map((todo) =>
        todo.id === updatedTodo.id
          ? { ...todo, text: updatedTodo.text, priority: updatedTodo.priority }
          : todo
      ),
    }));

    setEditingTodo(null);
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "gym", label: "Gym", icon: Dumbbell },
    { id: "productivity", label: "Productivity", icon: BookOpen },
    { id: "todo", label: "Todo", icon: Check },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Flame size={22} />
          </div>
          <div>
            <h1>My Progress</h1>
            <span>Strength • Focus • Growth</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button className="quick-add-sidebar" onClick={() => setShowTodoModal(true)}>
          <Zap size={18} />
          Quick Add
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL TRACKER</p>
            <h2>{getPageTitle(page)}</h2>
          </div>

          <div className="top-actions">
            <span className="today-label">{formatDate(today)}</span>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowTodoModal(true)}
            >
              <Plus size={17} />
              Add Todo
            </button>
          </div>
        </header>

        {page === "dashboard" && (
          <Dashboard
            totalWorkouts={totalWorkouts}
            totalPRs={totalPRs}
            latestWeight={latestWeight}
            productivityScore={productivityScore}
            totalProductivityTasks={totalProductivityTasks}
            todoPending={todoPending}
            todayProductivity={todayProductivity}
            todos={state.todos}
            updateTodayProductivity={updateTodayProductivity}
            customTasks={customTasks}
            updateCustomProductivity={updateCustomProductivity}
            setPage={setPage}
            setShowWorkoutModal={setShowWorkoutModal}
            setShowWeightModal={setShowWeightModal}
            setShowTodoModal={setShowTodoModal}
            toggleTodo={toggleTodo}
          />
        )}

        {page === "gym" && (
          <GymPage
            state={state}
            workoutPlans={state.workoutPlans || WORKOUTS}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            setShowWorkoutModal={setShowWorkoutModal}
            setShowWeightModal={setShowWeightModal}
            onEditPlan={() => setShowPlanModal(true)}
            onEditWorkout={editWorkout}
          />
        )}

        {page === "productivity" && (
          <ProductivityPage
            data={todayProductivity}
            update={updateTodayProductivity}
            state={state}
            productivityTasks={state.productivityTasks || []}
            onAddTask={() => {
              setEditingProductivityTask(null);
              setShowProductivityModal(true);
            }}
            onEditTask={editProductivityTask}
            onDeleteTask={deleteProductivityTask}
            onUpdateCustomTask={updateCustomProductivity}
          />
        )}

        {page === "todo" && (
          <TodoPage
            todos={state.todos}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            editTodo={editTodo}
            setShowTodoModal={setShowTodoModal}
          />
        )}

        {page === "progress" && <ProgressPage state={state} />}
      </main>

      {showWorkoutModal && (
          <WorkoutModal
            selectedDay={selectedDay}
            workoutPlans={state.workoutPlans || WORKOUTS}
            onClose={() => setShowWorkoutModal(false)}
            onSave={addWorkout}
          />
      )}

      {showWeightModal && (
        <WeightModal
          onClose={() => setShowWeightModal(false)}
          onSave={addBodyWeight}
        />
      )}

      {showTodoModal && (
        <TodoModal
          onClose={() => setShowTodoModal(false)}
          onSave={addTodo}
        />
      )}

      {editingTodo && (
        <TodoEditModal
          key={editingTodo.id}
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSave={saveEditedTodo}
        />
      )}

      {showProductivityModal && (
        <ProductivityTaskModal
          key={editingProductivityTask?.id ?? "new"}
          task={editingProductivityTask}
          onClose={() => {
            setShowProductivityModal(false);
            setEditingProductivityTask(null);
          }}
          onSave={
            editingProductivityTask
              ? saveEditedProductivityTask
              : addProductivityTask
          }
        />
      )}


      {showPlanModal && (
        <WorkoutPlanModal
          key={selectedDay}
          day={selectedDay}
          workout={state.workoutPlans?.[selectedDay] || WORKOUTS[selectedDay]}
          onClose={() => setShowPlanModal(false)}
          onSave={(plan) => saveWorkoutPlan(selectedDay, plan)}
        />
      )}

      {editingWorkout && (
        <EditWorkoutModal
          key={editingWorkout.id}
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSave={saveEditedWorkout}
          onDelete={deleteWorkout}
        />
      )}
    </div>
  );
}

function getPageTitle(page) {
  const titles = {
    dashboard: "Dashboard",
    gym: "Gym Tracker",
    productivity: "Productivity",
    todo: "Todo List",
    progress: "Progress",
  };

  return titles[page];
}

function Dashboard({
  totalWorkouts,
  totalPRs,
  latestWeight,
  productivityScore,
  totalProductivityTasks,
  todoPending,
  todayProductivity,
  todos,
  updateTodayProductivity,
  customTasks,
  updateCustomProductivity,
  setPage,
  setShowWorkoutModal,
  setShowWeightModal,
  setShowTodoModal,
  toggleTodo,
}) {
  const productivityPercent =
    totalProductivityTasks > 0
      ? Math.round((productivityScore / totalProductivityTasks) * 100)
      : 0;

  return (
    <div className="page-content">
      <section className="hero">
        <div>
          <p className="hero-kicker">KEEP MOVING FORWARD</p>
          <h3>Your progress, in one place.</h3>
          <p>
            Track your strength, habits, reading, coding and everything you
            need to get done.
          </p>
        </div>
        <div className="hero-mark">
          <Trophy size={48} />
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          icon={<Dumbbell />}
          label="Workouts"
          value={totalWorkouts}
          sub="total logged"
        />
        <StatCard
          icon={<Trophy />}
          label="PRs"
          value={totalPRs}
          sub="weight milestones"
        />
        <StatCard
          icon={<Weight />}
          label="Body Weight"
          value={latestWeight ? `${latestWeight} kg` : "—"}
          sub="latest entry"
        />
        <StatCard
          icon={<Flame />}
          label="Today's Focus"
          value={`${productivityPercent}%`}
          sub={`${productivityScore}/${totalProductivityTasks} completed`}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">TODAY</p>
              <h3>Productivity</h3>
            </div>
            <button className="text-button" onClick={() => setPage("productivity")}>
              View all →
            </button>
          </div>

          <ProductivityMini
            label="Thirukkural"
            value={todayProductivity.thirukkural}
            target={5}
          />
          <ProductivityMini
            label="Book"
            value={todayProductivity.book}
            target={5}
          />
          <ProductivityMini
            label="Manga"
            value={todayProductivity.manga}
            target={100}
          />
          <ProductivityMini
            label="LeetCode"
            value={todayProductivity.leetcode}
            target={2}
          />

          {customTasks.map((task) => (
            <ProductivityMini
              key={task.id}
              label={task.name}
              value={Number(todayProductivity.custom?.[task.id] || 0)}
              target={Number(task.target)}
            />
          ))}

          <div className="mini-checks">
            <MiniCheck
              label="Gmail"
              checked={todayProductivity.gmail}
              onClick={() => updateTodayProductivity("gmail", !todayProductivity.gmail)}
            />

            <MiniCheck
              label="LinkedIn"
              checked={todayProductivity.linkedin}
              onClick={() =>
                updateTodayProductivity("linkedin", !todayProductivity.linkedin)
              }
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">ACTION</p>
              <h3>Quick Actions</h3>
            </div>
          </div>

          <div className="action-grid">
            <button onClick={() => setShowWorkoutModal(true)}>
              <Dumbbell />
              <span>Log Workout</span>
            </button>
            <button onClick={() => setShowWeightModal(true)}>
              <Weight />
              <span>Body Weight</span>
            </button>
            <button onClick={() => setPage("productivity")}>
              <BookOpen />
              <span>Log Progress</span>
            </button>
            <button onClick={() => setShowTodoModal(true)}>
              <Plus />
              <span>Add Todo</span>
            </button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">TODO</p>
            <h3>
              What needs doing?{" "}
              {todoPending > 0 && (
                <span style={{ color: "#f0b90b" }}>({todoPending})</span>
              )}
            </h3>
          </div>
          <button className="text-button" onClick={() => setPage("todo")}>
            View all →
          </button>
        </div>

        {todos.filter((todo) => !todo.completed).slice(0, 5).length === 0 ? (
          <EmptyState
            icon={<Check size={26} />}
            title="Nothing pending"
            text="Your todo list is clear."
          />
        ) : (
          <div className="todo-list compact">
            {todos
              .filter((todo) => !todo.completed)
              .slice(0, 5)
              .map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  toggleTodo={toggleTodo}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

function ProductivityMini({ label, value, target }) {
  const percent = Math.min(100, Math.round((value / target) * 100));

  return (
    <div className="productivity-mini">
      <div className="mini-top">
        <span>{label}</span>
        <strong>
          {value}/{target}
        </strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MiniCheck({ label, checked, onClick }) {
  return (
    <button className="mini-check" onClick={onClick}>
      <span className={checked ? "check checked" : "check"}>
        {checked && <Check size={13} />}
      </span>
      {label}
    </button>
  );
}

function GymPage({
  state,
  workoutPlans,
  selectedDay,
  setSelectedDay,
  setShowWorkoutModal,
  setShowWeightModal,
  onEditPlan,
  onEditWorkout,
}) {
  const selected = workoutPlans[selectedDay];

  return (
    <div className="page-content">
      <div className="page-actions">
        <div>
          <p className="section-label">WORKOUT SPLIT</p>
          <h3>Choose your training day</h3>
        </div>

        <div className="button-row">
          <button
            className="secondary-button"
            onClick={() => setShowWeightModal(true)}
          >
            <Weight size={17} />
            Log Body Weight
          </button>

          <button
            className="secondary-button"
            onClick={onEditPlan}
          >
            <Pencil size={17} />
            Edit Workout
          </button>

          <button
            className="primary-button"
            onClick={() => setShowWorkoutModal(true)}
          >
            <Plus size={17} />
            Log Workout
          </button>
        </div>
      </div>

      <div className="day-selector">
        {Object.entries(workoutPlans).map(([day, workout]) => (
          <button
            key={day}
            className={selectedDay === day ? "selected" : ""}
            onClick={() => setSelectedDay(day)}
          >
            <strong>{day}</strong>
            <span>{workout.name}</span>
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">{selectedDay}</p>
            <h3>{selected.name}</h3>
          </div>

          <span className="exercise-count">
            {selected.exercises.length} exercises
          </span>
        </div>

        <div className="exercise-grid">
          {selected.exercises.map((exercise, index) => (
            <div className="exercise-card" key={exercise}>
              <span className="exercise-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <strong>{exercise}</strong>
                <span>Ready to log</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">HISTORY</p>
            <h3>Recent workouts</h3>
          </div>
        </div>

        {state.workouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={26} />}
            title="No workouts logged yet"
            text="Log your first workout to start building your history."
          />
        ) : (
          <div className="history-list">
            {state.workouts
              .slice()
              .reverse()
              .slice(0, 10)
              .map((workout) => (
                <div className="history-row" key={workout.id}>
                  <div className="history-day">
                    {workout.day}
                  </div>

                  <div>
                    <strong>{workout.name}</strong>
                    <span>{formatDate(workout.date)}</span>
                  </div>

                  <span>
                    {workout.exercises.length} exercises
                  </span>

                  <button
                    className="icon-button"
                    title="Edit workout"
                    onClick={() => onEditWorkout(workout)}
                  >
                    <Pencil size={17} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductivityPage({
  data,
  update,
  state,
  productivityTasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateCustomTask,
}) {
  const customTasks = productivityTasks || [];

  return (
    <div className="page-content">
      <section className="panel productivity-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">TODAY</p>
            <h3>Daily Progress</h3>
          </div>

          <div className="today-score">
            {getProductivityPercent(data, customTasks)}%
          </div>
        </div>

        <ProgressInput
          label="Thirukkural"
          icon="📜"
          value={data.thirukkural}
          target={5}
          suffix="pages"
          onChange={(value) => update("thirukkural", value)}
        />

        <ProgressInput
          label="Book"
          icon="📖"
          value={data.book}
          target={5}
          suffix="pages"
          onChange={(value) => update("book", value)}
        />

        <ProgressInput
          label="Manga"
          icon="📘"
          value={data.manga}
          target={100}
          suffix="pages"
          onChange={(value) => update("manga", value)}
        />

        <ProgressInput
          label="LeetCode"
          icon="💻"
          value={data.leetcode}
          target={2}
          suffix="questions"
          onChange={(value) => update("leetcode", value)}
        />

        <div className="toggle-grid">
          <ToggleItem
            label="Gmail"
            checked={data.gmail}
            onChange={(value) => update("gmail", value)}
          />

          <ToggleItem
            label="LinkedIn"
            checked={data.linkedin}
            onChange={(value) => update("linkedin", value)}
          />
        </div>
      </section>

      {/* EXTRA PRODUCTIVITY TASKS */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">CUSTOM</p>
            <h3>Extra Productivity</h3>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={onAddTask}
          >
            <Plus size={17} />
            Add Task
          </button>
        </div>

        {customTasks.length === 0 ? (
          <EmptyState
            icon={<Plus size={26} />}
            title="No extra tasks"
            text="Add your own productivity goals."
          />
        ) : (
          <div>
            {customTasks.map((task) => {
              const value = Number(data.custom?.[task.id] || 0);

              return (
                <div key={task.id} className="progress-input">
                  <div className="progress-info">
                    <div className="progress-name">
                      <span>⭐</span>
                      <strong>{task.name}</strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div className="number-control">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCustomTask(
                              task.id,
                              Math.max(0, value - 1)
                            )
                          }
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={value}
                          onChange={(e) =>
                            onUpdateCustomTask(
                              task.id,
                              Math.max(0, Number(e.target.value))
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCustomTask(task.id, value + 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="icon-button"
                        title="Edit task"
                        onClick={() => onEditTask(task)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-button danger"
                        title="Delete task"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <span className="target-label">
                      {value}/{task.target} {task.unit}
                    </span>
                  </div>

                  <div className="progress-track large">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((value / task.target) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HISTORY */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">HISTORY</p>
            <h3>Previous days</h3>
          </div>
        </div>

        {Object.keys(state.productivity).length === 0 ? (
          <EmptyState
            icon={<BookOpen size={26} />}
            title="No history yet"
            text="Start logging today's progress."
          />
        ) : (
          <div className="history-list">
            {Object.entries(state.productivity)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 14)
              .map(([date, item]) => (
                <div className="productivity-history" key={date}>
                  <strong>{formatDate(date)}</strong>
                  <span>📜 {item.thirukkural}</span>
                  <span>📖 {item.book}</span>
                  <span>📘 {item.manga}</span>
                  <span>💻 {item.leetcode}</span>
                  <span>{item.gmail ? "✓ Gmail" : "— Gmail"}</span>
                  <span>
                    {item.linkedin ? "✓ LinkedIn" : "— LinkedIn"}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProgressInput({
  label,
  icon,
  value,
  target,
  suffix,
  onChange,
}) {
  const percent = Math.min(100, Math.round((value / target) * 100));

  return (
    <div className="progress-input">
      <div className="progress-info">
        <div className="progress-name">
          <span>{icon}</span>
          <strong>{label}</strong>
        </div>

        <div className="number-control">
          <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          />
          <button type="button" onClick={() => onChange(value + 1)}>+</button>
        </div>

        <span className="target-label">
          {value}/{target} {suffix}
        </span>
      </div>

      <div className="progress-track large">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ToggleItem({ label, checked, onChange }) {
  return (
    <button
      type="button"
      className={`toggle-item ${checked ? "done" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="check">{checked && <Check size={15} />}</span>
      <strong>{label}</strong>
      <span>{checked ? "Completed" : "Not completed"}</span>
    </button>
  );
}

function TodoPage({ todos, toggleTodo, deleteTodo, editTodo, setShowTodoModal }) {
  const pending = todos.filter((todo) => !todo.completed);
  const completed = todos.filter((todo) => todo.completed);

  return (
    <div className="page-content">
      <div className="page-actions">
        <div>
          <p className="section-label">TASKS</p>
          <h3>Everything on your mind</h3>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowTodoModal(true)}
        >
          <Plus size={17} />
          Add Todo
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">PENDING</p>
            <h3>{pending.length} tasks remaining</h3>
          </div>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            icon={<Check size={26} />}
            title="You're all caught up"
            text="Add something when it comes to mind."
          />
        ) : (
          <div className="todo-list">
            {pending.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                editTodo={editTodo}
              />
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">DONE</p>
              <h3>Completed</h3>
            </div>
          </div>

          <div className="todo-list completed-list">
            {completed.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                editTodo={editTodo}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TodoRow({ todo, toggleTodo, deleteTodo, editTodo }) {
  return (
    <div className={`todo-row ${todo.completed ? "completed" : ""}`}>
      <button className="todo-check" onClick={() => toggleTodo(todo.id)}>
        {todo.completed && <Check size={15} />}
      </button>

      <div className="todo-content">
        <strong>{todo.text}</strong>
        <span className={`priority ${todo.priority}`}>
          {todo.priority}
        </span>
      </div>

      {editTodo && (
        <button
          className="icon-button"
          title="Edit todo"
          onClick={() => editTodo(todo)}
        >
          <Pencil size={17} />
        </button>
      )}

      {deleteTodo && (
        <button className="icon-button danger" onClick={() => deleteTodo(todo.id)}>
          <Trash2 size={17} />
        </button>
      )}
    </div>
  );
}

function ProgressPage({ state }) {
  const weightData = state.bodyWeights.map((entry) => ({
    date: formatDate(entry.date).slice(0, 6),
    weight: entry.weight,
  }));

  const exerciseBest = {};

  state.workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        const weight = Number(set.weight) || 0;
        exerciseBest[exercise.name] = Math.max(
          exerciseBest[exercise.name] || 0,
          weight
        );
      });
    });
  });

  return (
    <div className="page-content">
      <div className="stat-grid">
        <StatCard
          icon={<Dumbbell />}
          label="Workout Days"
          value={state.workouts.length}
          sub="logged sessions"
        />
        <StatCard
          icon={<Trophy />}
          label="Exercises"
          value={Object.keys(exerciseBest).length}
          sub="tracked"
        />
        <StatCard
          icon={<Weight />}
          label="Weight Entries"
          value={state.bodyWeights.length}
          sub="logged"
        />
        <StatCard
          icon={<Check />}
          label="Todos Done"
          value={state.todos.filter((t) => t.completed).length}
          sub="completed tasks"
        />
      </div>

      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">BODY WEIGHT</p>
            <h3>Weight progression</h3>
          </div>
        </div>

        {weightData.length < 2 ? (
          <EmptyState
            icon={<TrendingUp size={26} />}
            title="Not enough data"
            text="Log at least two body-weight entries to see the graph."
          />
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  strokeWidth={3}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-label">STRENGTH</p>
            <h3>Exercise bests</h3>
          </div>
        </div>

        {Object.keys(exerciseBest).length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={26} />}
            title="No strength data yet"
            text="Log a workout with weights to start tracking."
          />
        ) : (
          <div className="best-grid">
            {Object.entries(exerciseBest)
              .sort(([, a], [, b]) => b - a)
              .map(([exercise, weight]) => (
                <div className="best-card" key={exercise}>
                  <span>{exercise}</span>
                  <strong>{weight} kg</strong>
                  <small>best logged weight</small>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkoutPlanModal({ day, workout, onClose, onSave }) {
  const [name, setName] = useState(workout.name);
  const [exercises, setExercises] = useState([...workout.exercises]);

  function updateExercise(index, value) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === index ? value : exercise
      )
    );
  }

  function addExercise() {
    setExercises((current) => [...current, ""]);
  }

  function removeExercise(index) {
    setExercises((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function moveExercise(index, direction) {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= exercises.length) {
      return;
    }

    const updated = [...exercises];

    [updated[index], updated[newIndex]] = [
      updated[newIndex],
      updated[index],
    ];

    setExercises(updated);
  }

  function save() {
    const cleanedExercises = exercises
      .map((exercise) => exercise.trim())
      .filter(Boolean);

    if (!name.trim() || cleanedExercises.length === 0) {
      return;
    }

    onSave({
      name: name.trim(),
      exercises: cleanedExercises,
    });
  }

  return (
    <Modal
      title={`Edit ${day} Workout`}
      onClose={onClose}
    >
      <div className="simple-form">
        <label>
          Workout name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push A"
          />
        </label>

        <div>
          <strong>Exercises</strong>

          <div className="workout-plan-editor">
            {exercises.map((exercise, index) => (
              <div
                className="plan-exercise-row"
                key={index}
              >
                <span className="exercise-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <input
                  value={exercise}
                  onChange={(e) =>
                    updateExercise(index, e.target.value)
                  }
                  placeholder="Exercise name"
                />

                <button
                  type="button"
                  className="icon-button"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => moveExercise(index, -1)}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="icon-button"
                  title="Move down"
                  disabled={index === exercises.length - 1}
                  onClick={() => moveExercise(index, 1)}
                >
                  ↓
                </button>

                <button
                  type="button"
                  className="icon-button danger"
                  title="Remove exercise"
                  onClick={() => removeExercise(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={addExercise}
        >
          <Plus size={16} />
          Add Exercise
        </button>
      </div>

      <div className="modal-footer">
        <button
          className="secondary-button"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="primary-button"
          onClick={save}
        >
          <Check size={17} />
          Save Workout
        </button>
      </div>
    </Modal>
  );
}

function EditWorkoutModal({
  workout,
  onClose,
  onSave,
  onDelete,
}) {
  const [exercises, setExercises] = useState(
    workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        weight: set.weight ?? "",
        reps: set.reps ?? "",
      })),
    }))
  );

  function updateSet(exerciseIndex, setIndex, field, value) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, j) =>
                j === setIndex
                  ? { ...set, [field]: value }
                  : set
              ),
            }
          : exercise
      )
    );
  }

  function addSet(exerciseIndex) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                { weight: "", reps: "" },
              ],
            }
          : exercise
      )
    );
  }

  function removeSet(exerciseIndex, setIndex) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter(
                (_, j) => j !== setIndex
              ),
            }
          : exercise
      )
    );
  }

  function save() {
    const cleanedExercises = exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter(
          (set) =>
            set.weight !== "" ||
            set.reps !== ""
        ),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    onSave({
      ...workout,
      exercises: cleanedExercises,
    });
  }

  return (
    <Modal
      title={`Edit ${workout.day} — ${workout.name}`}
      onClose={onClose}
    >
      <div className="workout-form">
        {exercises.map((exercise, exerciseIndex) => (
          <div
            className="modal-exercise"
            key={`${exercise.name}-${exerciseIndex}`}
          >
            <div className="modal-exercise-title">
              <strong>{exercise.name}</strong>

              <button
                type="button"
                onClick={() => addSet(exerciseIndex)}
              >
                <Plus size={14} />
                Set
              </button>
            </div>

            {exercise.sets.map((set, setIndex) => (
              <div
                className="set-row"
                key={setIndex}
              >
                <span>
                  Set {setIndex + 1}
                </span>

                <input
                  type="number"
                  placeholder="Weight"
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(
                      exerciseIndex,
                      setIndex,
                      "weight",
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(
                      exerciseIndex,
                      setIndex,
                      "reps",
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="icon-button danger"
                  title="Remove set"
                  onClick={() =>
                    removeSet(
                      exerciseIndex,
                      setIndex
                    )
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="danger-button"
          onClick={() => onDelete(workout.id)}
        >
          <Trash2 size={17} />
          Delete Workout
        </button>

        <div className="button-row">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={save}
          >
            <Check size={17} />
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

function WorkoutModal({
  selectedDay,
  workoutPlans,
  onClose,
  onSave,
}) {
  const workout = workoutPlans[selectedDay];

  // Sets are keyed by exercise INDEX (not name) so duplicate exercise
  // names in a plan don't collide/share state.
  const [sets, setSets] = useState(
    workout.exercises.map(() => [{ weight: "", reps: "" }])
  );

  function updateSet(exerciseIndex, setIndex, field, value) {
    setSets((current) =>
      current.map((exSets, i) =>
        i === exerciseIndex
          ? exSets.map((set, j) =>
              j === setIndex ? { ...set, [field]: value } : set
            )
          : exSets
      )
    );
  }

  function addSet(exerciseIndex) {
    setSets((current) =>
      current.map((exSets, i) =>
        i === exerciseIndex
          ? [...exSets, { weight: "", reps: "" }]
          : exSets
      )
    );
  }

  function save() {
    const exercises = workout.exercises
      .map((exercise, i) => ({
        name: exercise,
        sets: sets[i].filter(
          (set) => set.weight !== "" || set.reps !== ""
        ),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    if (exercises.length === 0) {
      return;
    }

    onSave({
      // Date.now() + Math.random() avoids ID collisions when two
      // workouts are saved within the same millisecond.
      id: Date.now() + Math.random(),
      date: todayKey(),
      day: selectedDay,
      name: workout.name,
      exercises,
    });
  }

  return (
    <Modal title={`Log ${selectedDay} — ${workout.name}`} onClose={onClose}>
      <div className="workout-form">
        {workout.exercises.map((exercise, exerciseIndex) => (
          <div className="modal-exercise" key={`${exercise}-${exerciseIndex}`}>
            <div className="modal-exercise-title">
              <strong>{exercise}</strong>
              <button type="button" onClick={() => addSet(exerciseIndex)}>
                <Plus size={14} />
                Set
              </button>
            </div>

            {sets[exerciseIndex].map((set, index) => (
              <div className="set-row" key={index}>
                <span>Set {index + 1}</span>
                <input
                  type="number"
                  placeholder="Weight"
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(exerciseIndex, index, "weight", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(exerciseIndex, index, "reps", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary-button" onClick={save}>
          <Check size={17} />
          Save Workout
        </button>
      </div>
    </Modal>
  );
}

function WeightModal({ onClose, onSave }) {
  const [weight, setWeight] = useState("");

  return (
    <Modal title="Log Body Weight" onClose={onClose}>
      <div className="simple-form">
        <label>
          Body weight
          <div className="input-with-suffix">
            <input
              autoFocus
              type="number"
              step="0.1"
              placeholder="63.4"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <span>kg</span>
          </div>
        </label>
      </div>

      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="primary-button"
          disabled={!weight}
          onClick={() => onSave(weight)}
        >
          Save Weight
        </button>
      </div>
    </Modal>
  );
}

function ProductivityTaskModal({ task, onClose, onSave }) {
  const [name, setName] = useState(task?.name || "");
  const [target, setTarget] = useState(task?.target || 1);
  const [unit, setUnit] = useState(task?.unit || "times");

  function submit(e) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanTarget = Number(target);

    if (!cleanName || cleanTarget <= 0) return;

    onSave({
      ...(task || {}),
      name: cleanName,
      target: cleanTarget,
      unit: unit.trim() || "times",
    });
  }

  return (
    <Modal
      title={task ? "Edit Productivity Task" : "Add Productivity Task"}
      onClose={onClose}
    >
      <form className="simple-form" onSubmit={submit}>
        <label>
          Task name
          <input
            autoFocus
            type="text"
            placeholder="Example: Meditation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label>
          Daily target
          <input
            type="number"
            min="1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>

        <label>
          Unit
          <input
            type="text"
            placeholder="minutes, pages, hours, times..."
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </label>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button">
            {task ? (
              <>
                <Check size={17} />
                Save Changes
              </>
            ) : (
              <>
                <Plus size={17} />
                Add Task
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TodoModal({ onClose, onSave }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");

  function submit(e) {
    e.preventDefault();

    const tasks = text
      .split("\n")
      .map((task) => task.trim())
      .filter(Boolean);

    if (tasks.length === 0) return;

    tasks.forEach((task) => {
      onSave({
        text: task,
        priority,
      });
    });

    onClose();
  }

  return (
    <Modal title="Quick Add Todo" onClose={onClose}>
      <form className="simple-form" onSubmit={submit}>
        <label>
          What do you need to do?
          <textarea
            autoFocus
            rows="8"
            placeholder={`Enter one task per line...

Example:
MPMC record
Hackathon
Internship
Portfolio`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button">
            <Plus size={17} />
            Add Tasks
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TodoEditModal({ todo, onClose, onSave }) {
  const [text, setText] = useState(todo.text);
  const [priority, setPriority] = useState(todo.priority);

  function submit(e) {
    e.preventDefault();

    const cleanText = text.trim();
    if (!cleanText) return;

    onSave({
      ...todo,
      text: cleanText,
      priority,
    });
  }

  return (
    <Modal title="Edit Todo" onClose={onClose}>
      <form className="simple-form" onSubmit={submit}>
        <label>
          Task
          <input
            autoFocus
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button type="submit" className="primary-button">
            <Check size={17} />
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function getProductivityPercent(data, customTasks = []) {
  const completedFixed = [
    data.thirukkural >= 5,
    data.book >= 5,
    data.manga >= 100,
    data.leetcode >= 2,
    data.gmail,
    data.linkedin,
  ].filter(Boolean).length;

  const completedCustom = customTasks.filter(
    (task) =>
      Number(data.custom?.[task.id] || 0) >= Number(task.target)
  ).length;

  const totalTasks = 6 + customTasks.length;

  if (totalTasks === 0) return 0;

  return Math.round(
    ((completedFixed + completedCustom) / totalTasks) * 100
  );
}

export default App;