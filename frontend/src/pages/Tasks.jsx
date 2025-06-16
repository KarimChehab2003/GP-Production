import { useEffect, useState } from "react";
import { useTasks } from "../contexts/TasksContext";

function Tasks() {
  const { tasks } = useTasks();
  const [taskList, setTaskList] = useState([]);

  useEffect(() => {
    setTaskList(tasks);
  }, [tasks]);
  console.log("This is tasks:", taskList);
  return (
    <section>
      {taskList.length === 0 ? (
        <p>No tasks</p>
      ) : (
        taskList.map(({ subject, type }, idx) => (
          <article key={idx}>
            <p>Subject: {subject}</p>
            <p>Event Type: {type}</p>
          </article>
        ))
      )}
    </section>
  );
}

export default Tasks;
