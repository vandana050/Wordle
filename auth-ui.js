let isSignup = false;

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("form-title");
const toggleText = document.getElementById("toggleText");
const msg = document.getElementById("msg");

// ========== TOGGLE LOGIN / SIGNUP ==========
function toggleForm() {
  isSignup = !isSignup;

  formTitle.innerText = isSignup ? "Sign Up" : "Login";
  submitBtn.innerText = isSignup ? "Sign Up" : "Login";

  usernameInput.style.display = isSignup ? "block" : "none";

  toggleText.innerHTML = isSignup
    ? `Already have an account?
       <span class="link" onclick="toggleForm()">Login</span>`
    : `Don’t have an account?
       <span class="link" onclick="toggleForm()">Sign up</span>`;

  msg.innerText = "";
}

// ========== LOGIN ==========
async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    msg.innerText = "Please fill all fields";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.message || "Login failed";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.removeItem("guest"); // ensure clean state
    window.location.href = "index.html";

  } catch (err) {
    msg.innerText = "Server error. Try again.";
  }
}

// ========== SIGNUP ==========
async function signup() {
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !email || !password) {
    msg.innerText = "Please fill all fields";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.message || "Signup failed";
      return;
    }

    msg.style.color = "#4CAF50";
    msg.innerText = "Signup successful! Please login.";
    toggleForm();

  } catch (err) {
    msg.innerText = "Server error. Try again.";
  }
}

// ========== SUBMIT HANDLER ==========
submitBtn.addEventListener("click", () => {
  isSignup ? signup() : login();
});

// ========== ENTER KEY SUPPORT ==========
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    isSignup ? signup() : login();
  }
});

// ========== CONTINUE AS GUEST ==========
function continueAsGuest() {
  localStorage.setItem("guest", "true");
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
