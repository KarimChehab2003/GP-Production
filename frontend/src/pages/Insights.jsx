import { useEffect, useState } from "react";
import { useTasks } from "../contexts/TasksContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

function Insights() {
  const { tasks } = useTasks();
  const [completionByType, setCompletionByType] = useState({});
  const [progressBySubject, setProgressBySubject] = useState({});
  const [completionVsSchedule, setCompletionVsSchedule] = useState({});
  const [cumulativeSessionsData, setCumulativeSessionsData] = useState([]);
  const [quizPerformance, setQuizPerformance] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    passRate: 0,
    recentOutcomes: [],
  });

  useEffect(() => {
    console.log("Insights - All tasks from context:", tasks);

    // Calculate Completion by Type
    const typeCounts = tasks.reduce((acc, task) => {
      if (task.type === "lecture") {
        acc.lecture = (acc.lecture || 0) + 1;
      } else if (task.type === "section") {
        acc.section = (acc.section || 0) + 1;
      } else if (task.type === "study") {
        acc.study = (acc.study || 0) + 1;
      } else if (task.type === "quiz-outcome") {
        // Count all quiz outcomes as 'quiz' type for this chart
        acc.quiz = (acc.quiz || 0) + 1;
      }
      return acc;
    }, {});
    setCompletionByType(typeCounts);

    // Calculate Progress within Subject/Course
    const subjectProgress = tasks.reduce((acc, task) => {
      if (task.type === "lecture" || task.type === "section") {
        if (!acc[task.subject]) {
          acc[task.subject] = new Set();
        }
        if (task.number) {
          acc[task.subject].add(task.number);
        }
      }
      return acc;
    }, {});

    const formattedProgress = {};
    for (const subject in subjectProgress) {
      formattedProgress[subject] = subjectProgress[subject].size;
    }
    setProgressBySubject(formattedProgress);

    // Calculate Completion vs. Schedule
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const collegeSchedule = currentUser?.timetable?.schedule;

    if (collegeSchedule) {
      let totalScheduledSessions = 0;
      let completedScheduledSessions = 0;
      const completedSessionKeys = new Set(); // To track unique completed sessions

      // Create a unique key for each completed session
      tasks.forEach((task) => {
        if (
          task.type === "lecture" ||
          task.type === "section" ||
          task.type === "study"
        ) {
          // Using day, time, and subject to identify a scheduled slot
          const key = `${task.day}-${task.time}-${task.subject}`;
          completedSessionKeys.add(key);
        }
      });

      // Iterate through the college schedule to compare
      for (const day in collegeSchedule) {
        const daySchedule = collegeSchedule[day];
        for (const time in daySchedule) {
          const scheduledContent = daySchedule[time];
          if (
            scheduledContent.startsWith("Lec:") ||
            scheduledContent.startsWith("Sec:") ||
            scheduledContent.startsWith("Study:")
          ) {
            totalScheduledSessions++;
            const subjectExtracted = scheduledContent
              .replace(/^(Lec:|Sec:|Study:)\s*/, "")
              .trim();
            const key = `${day}-${time}-${subjectExtracted}`;
            if (completedSessionKeys.has(key)) {
              completedScheduledSessions++;
            }
          }
        }
      }

      const percentage =
        totalScheduledSessions > 0
          ? (
              (completedScheduledSessions / totalScheduledSessions) *
              100
            ).toFixed(2)
          : "0.00";

      setCompletionVsSchedule({
        total: totalScheduledSessions,
        completed: completedScheduledSessions,
        percentage: percentage,
      });
    }

    // Calculate Quiz Performance (Pass/Fail Ratio and basic trends)
    const quizOutcomes = tasks.filter((task) => task.type === "quiz-outcome");
    console.log("Insights - Quiz outcomes:", quizOutcomes);

    let passedQuizzes = 0;
    let failedQuizzes = 0;

    quizOutcomes.forEach((quiz) => {
      if (quiz.status === "passed") {
        passedQuizzes++;
      } else if (quiz.status === "failed") {
        failedQuizzes++;
      }
    });

    const totalQuizzes = passedQuizzes + failedQuizzes;
    const passRate =
      totalQuizzes > 0
        ? ((passedQuizzes / totalQuizzes) * 100).toFixed(2)
        : "0.00";

    setQuizPerformance({
      total: totalQuizzes,
      passed: passedQuizzes,
      failed: failedQuizzes,
      passRate: passRate,
      recentOutcomes: quizOutcomes
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5), // Get 5 most recent for basic trend
    });

    // Calculate Cumulative Sessions Completed
    const completedSessions = tasks.filter(
      (task) =>
        task.type === "lecture" ||
        task.type === "section" ||
        task.type === "study"
    );

    completedSessions.sort((a, b) => a.timestamp - b.timestamp);

    const dailyCounts = {};
    completedSessions.forEach((task) => {
      const date = new Date(task.timestamp).toLocaleDateString(); // e.g., "6/16/2025"
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    let cumulativeCount = 0;
    const dataForChart = Object.keys(dailyCounts).map((date) => {
      cumulativeCount += dailyCounts[date];
      return { date, sessions: cumulativeCount };
    });
    setCumulativeSessionsData(dataForChart);
  }, [tasks]); // Depend on 'tasks' to re-run when new tasks are added

  return (
    <section className="p-6">
      <h2 className="text-3xl font-bold mb-6">My Learning Insights</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sessions Completed by Type (Bar Chart) */}
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-center flex-col items-center">
          <h3 className="text-xl font-semibold mb-4">
            Sessions Completed by Type
          </h3>
          {Object.keys(completionByType).length === 0 ? (
            <p className="text-gray-600">No completed sessions recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(completionByType).map(([name, value]) => ({
                  name,
                  value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {Object.entries(completionByType).map((entry, index) => {
                    const colors = [
                      "#8884d8",
                      "#82ca9d",
                      "#ffc658",
                      "#ff8042",
                      "#808080",
                    ]; // Added a fifth color for safety
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    );
                  })}
                </Bar>
              </BarChart>

              {/* Custom Legend */}
              <div className="flex justify-center mt-4 space-x-4">
                {Object.entries(completionByType).map((entry, index) => {
                  const colors = [
                    "#8884d8",
                    "#82ca9d",
                    "#ffc658",
                    "#ff8042",
                    "#808080",
                  ]; // Must match chart colors
                  const name = entry[0];
                  return (
                    <div key={name} className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      ></span>
                      <span className="text-sm capitalize">{name}</span>
                    </div>
                  );
                })}
              </div>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quiz Performance (Pie Chart) - Moved here */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Quiz Performance</h3>
          {quizPerformance.total === 0 ? (
            <p className="text-gray-600">No quizzes attempted yet.</p>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Passed", value: quizPerformance.passed },
                      { name: "Failed", value: quizPerformance.failed },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    <Cell key={`cell-0`} fill="#82ca9d" />{" "}
                    {/* Green for Passed */}
                    <Cell key={`cell-1`} fill="#ff6b6b" />{" "}
                    {/* Red for Failed */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {quizPerformance?.recentOutcomes?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Recent Quiz Outcomes:</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm">
                    {quizPerformance.recentOutcomes.map((quiz, idx) => (
                      <li key={idx}>
                        {new Date(quiz.timestamp).toLocaleDateString()}:{" "}
                        {quiz.subject} - {quiz.status.toUpperCase()} (Score:{" "}
                        {quiz.score}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress within Subject/Course */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            Progress by Subject (Lectures/Sections)
          </h3>
          {Object.keys(progressBySubject).length === 0 ? (
            <p className="text-gray-600">No lectures/sections completed yet.</p>
          ) : (
            <ul className="list-disc list-inside space-y-2">
              {Object.entries(progressBySubject).map(([subject, count]) => (
                <li key={subject} className="text-gray-800">
                  <span className="font-medium">{subject}</span>: {count}{" "}
                  lectures/sections completed
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completion vs. Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            Completion vs. Schedule
          </h3>
          {completionVsSchedule.total === 0 ? (
            <p className="text-gray-600">
              No sessions scheduled or completed yet.
            </p>
          ) : (
            <div className="text-center">
              <p className="text-gray-800 text-lg">
                Completed {completionVsSchedule.completed} out of{" "}
                {completionVsSchedule.total} scheduled sessions.
              </p>
              <p className="text-indigo-600 text-2xl font-bold mt-2">
                {completionVsSchedule.percentage}%
              </p>
            </div>
          )}
        </div>

        {/* Cumulative Sessions Completed (Area Chart) - New Section */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h3 className="text-xl font-semibold mb-4">
            Cumulative Sessions Completed
          </h3>
          {cumulativeSessionsData.length === 0 ? (
            <p className="text-gray-600">
              No sessions completed yet for this chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={cumulativeSessionsData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}

export default Insights;
