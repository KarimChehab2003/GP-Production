import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import scheduleImg from "../assets/schedule.png";
import aiImg from "../assets/AI.png";
import howItWorkImg from "../assets/howItWork.png";
import graduationImg from "../assets/graduation.png";

const sections = [
  {
    key: "whatIsASPG",
    nav: "What is ASPG",
    title: "Achieve More with a Personalized Study Plan",
    subtitle: "Our adaptive study plan generator creates a schedule tailored to your unique learning style and pace. Focus on what matters most, track your progress, and reach your academic goals stress-free.",
    image: scheduleImg,
  },
  {
    key: "features",
    nav: "Features",
    title: "Smart Tools to Help You Succeed",
    subtitle: [
      "Automatic Personalized Schedule",
      "Progress Tracking",
      "Regular Adjustments Based on Your Performance",
      "AI-Powered Recommendations",
    ],
    image: aiImg,
  },
  {
    key: "howItWorks",
    nav: "How it works",
    title: "How it Works",
    subtitle: [
      "1- Sign up and answer a few questions about your study habits.",
      "2- Get a ready-made study plan designed just for you.",
      "3- Mark your completed tasks and see your progress in real time.",
      "4- Every two weeks, your plan updates based on your results — keeping you on track and motivated.",
    ],
    image: howItWorkImg,
  },
  {
    key: "benefits",
    nav: "Benefits",
    title: "Why Students Love It",
    subtitle: "Our adaptive study plan helps you manage time effectively, reduce stress, and boost your GPA. Join hundreds of students who've transformed their study routine and achieved better grades with less effort.",
    image: graduationImg,
  },
];

function Main() {
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const section = sections[selected];

  return (
    <div className="font-poppins bg-white min-h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-[8vw] py-6 bg-indigo-500 border-b border-indigo-200">
        <div className="font-bold text-2xl text-white">ASPG</div>
        <div className="flex gap-8 items-center">
          {sections.map((s, idx) => (
            <button
              key={s.key}
              onClick={() => setSelected(idx)}
              className={`text-indigo-100 no-underline font-medium transition-colors cursor-pointer duration-200 ${selected === idx ? 'text-white underline underline-offset-8' : ''}`}
            >
              {s.nav}
            </button>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/signup')} className="bg-white text-indigo-600 border-none rounded-full px-7 py-2 font-semibold text-base cursor-pointer shadow-md hover:bg-indigo-100 transition">Sign Up</button>
          <button onClick={() => navigate('/login')} className="bg-none border-2 border-white text-white rounded-full px-7 py-2 font-semibold text-base cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition">Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative grid grid-cols-1 md:grid-cols-12 items-center px-[8vw] pt-16 pb-10">
        <div className="max-w-xl z-10 md:col-span-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-black mb-0">
            {section.title}
          </h1>
          {Array.isArray(section.subtitle) ? (
            section.key === "howItWorks" ? (
              <ul className="text-gray-700 text-lg mt-6 mb-8 w-full list-none space-y-2">
                {section.subtitle.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <ul className="text-gray-700 text-lg mt-6 mb-8 max-w-md list-disc list-inside space-y-2">
                {section.subtitle.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )
          ) : (
            <p className="text-gray-700 text-lg mt-6 mb-8 max-w-md">{section.subtitle}</p>
          )}
          <div className="flex gap-4 mb-8">
            <button onClick={() => navigate('/signup')} className="bg-indigo-600 text-white rounded-full px-9 py-3 font-bold text-lg shadow-md hover:bg-indigo-700 transition">Sign Up</button>
            <button onClick={() => navigate('/login')} className="bg-none border-2 border-indigo-400 text-indigo-700 rounded-full px-9 py-3 font-bold text-lg hover:bg-indigo-100 transition">Login</button>
          </div>
          {/* Dots navigation */}
          <div className="flex gap-2 mt-5">
            {sections.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setSelected(idx)}
                className={`w-3 h-3 rounded-full inline-block transition-colors duration-200 cursor-pointer ${selected === idx ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                aria-label={`Go to ${s.nav}`}
              />
            ))}
          </div>
        </div>
        {/* Hero Image & Badge */}
        <div className="flex justify-center relative min-w-[340px] mt-12 md:mt-0 md:col-span-6">
          <img src={section.image} alt={section.nav} className="w-[550px] h-[460px] object-cover" />
        </div>
      </section>
    </div>
  );
}

export default Main;