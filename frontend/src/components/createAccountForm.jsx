import { useNavigate } from "react-router-dom";

function CreateAccountForm({ createdUser, setCreatedUser, handleNext }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md w-full px-12 py-5 rounded-md shadow-xl bg-white">
      <div className="flex flex-col justify-between items-start space-y-10">
        <h2 className="text-2xl font-semibold my-6 charcoal">
          Create your account
        </h2>

        <form className="w-full space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">First name</label>
            <input
              type="text"
              className={
                "border-2 border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300"
              }
              value={createdUser.fname}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  fname: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">Last name</label>
            <input
              type="text"
              className="border-2 border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300"
              value={createdUser.lname}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  lname: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">Email</label>
            <input
              type="email"
              value={createdUser.email}
              className="border-2 border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300"
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  email: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">Password</label>
            <input
              type="password"
              className="border-2 border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300"
              value={createdUser.password}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  password: e.target.value,
                }))
              }
            />
          </div>

          <button
            className="w-full block text-white font-semibold bg-indigo-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
            onClick={handleNext}
          >
            Next
          </button>
        </form>

        <p className="mx-auto text-sm font-medium charcoal">
          Already have an account ?{" "}
          <span
            className="text-indigo-500 cursor-pointer hover:text-indigo-300 transition"
            onClick={() => navigate("/login")}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default CreateAccountForm;
