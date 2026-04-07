let isLoggedIn = false;

document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const loginBtn = document.getElementById('login-btn');
  const loginModal = document.getElementById('login-modal');
  const closeModal = document.getElementById('close-modal');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');

  // Event listeners
  closeModal.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    loginForm.reset();
    loginMessage.classList.add('hidden');
  });
  loginForm.addEventListener('submit', handleLogin);

  // Check auth status on load
  checkAuth();

  // Function to check auth status
  async function checkAuth() {
    try {
      const response = await fetch('/auth/status');
      const data = await response.json();
      isLoggedIn = data.logged_in;
      updateAuthUI();
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  }

  // Update auth UI
  function updateAuthUI() {
    if (isLoggedIn) {
      loginBtn.textContent = 'Logout';
      loginBtn.onclick = logout;
    } else {
      loginBtn.textContent = 'Login';
      loginBtn.onclick = showLoginModal;
    }
    fetchActivities();
  }

  // Show login modal
  function showLoginModal() {
    loginModal.classList.remove('hidden');
  }

  // Handle login
  async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/login', {
        method: 'POST',
        body: new URLSearchParams({ username, password }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const data = await response.json();
      if (response.ok) {
        loginMessage.textContent = data.message;
        loginMessage.className = 'success';
        loginModal.classList.add('hidden');
        isLoggedIn = true;
        updateAuthUI();
      } else {
        loginMessage.textContent = data.detail || 'Login failed';
        loginMessage.className = 'error';
      }
      loginMessage.classList.remove('hidden');
    } catch (error) {
      loginMessage.textContent = 'An error occurred';
      loginMessage.className = 'error';
      loginMessage.classList.remove('hidden');
    }
  }

  // Handle logout
  async function logout() {
    try {
      await fetch('/logout', { method: 'POST' });
      isLoggedIn = false;
      updateAuthUI();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants HTML
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${isLoggedIn ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ''}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        // Register button
        const registerButton = (spotsLeft > 0 && isLoggedIn)
          ? `<button class="register-btn" data-activity="${name}">Register Student</button>`
          : '';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${registerButton}
        `;

        activitiesList.appendChild(activityCard);

        // Add event listeners
        if (isLoggedIn) {
          const registerBtn = activityCard.querySelector('.register-btn');
          if (registerBtn) {
            registerBtn.addEventListener('click', handleRegister);
          }
          const deleteBtns = activityCard.querySelectorAll('.delete-btn');
          deleteBtns.forEach(btn => btn.addEventListener('click', handleUnregister));
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle register
  async function handleRegister(event) {
    const activity = event.target.getAttribute('data-activity');
    const email = prompt('Enter student email:');
    if (!email) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      const data = await response.json();
      showMessage(data.message, response.ok ? 'success' : 'error');
      if (response.ok) fetchActivities();
    } catch (error) {
      showMessage('An error occurred', 'error');
    }
  }

  // Handle unregister
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", 'error');
      }
    } catch (error) {
      showMessage('An error occurred', 'error');
    }
  }

  // Show message
  function showMessage(msg, type) {
    const msgDiv = document.getElementById('global-message');
    msgDiv.textContent = msg;
    msgDiv.className = type;
    msgDiv.classList.remove('hidden');
    setTimeout(() => msgDiv.classList.add('hidden'), 5000);
  }
});
